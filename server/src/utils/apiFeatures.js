/**
 * utils/apiFeatures.js
 * ---------------------------------------------------------
 * Reusable query builder => search + filter + sort + pagination.
 * Keeps the controllers clean:
 *
 *   const features = new ApiFeatures(Product.find(), req.query)
 *     .search(['name', 'description'])
 *     .filter()
 *     .sort()
 *     .paginate();
 */
class ApiFeatures {
  /**
   * @param {import('mongoose').Query} query mongoose query
   * @param {object} queryString usually req.query
   */
  constructor(query, queryString = {}) {
    this.query = query;
    this.queryString = queryString;
    this.page = Number(queryString.page) || 1;
    this.limit = Number(queryString.limit) || 12;
  }

  /** Case-insensitive search inside the given fields. */
  search(fields = ['name']) {
    const term = this.queryString.search || this.queryString.q;
    if (term && String(term).trim()) {
      const { escapeRegex } = require('./helpers');
      const regex = new RegExp(escapeRegex(String(term).trim()), 'i');
      this.query = this.query.find({ $or: fields.map((field) => ({ [field]: regex })) });
    }
    return this;
  }

  /**
   * Filter by any whitelisted field coming from the URL.
   * Supports ranges: price[gte]=10&price[lte]=50
   */
  filter(allowedFields = []) {
    const excluded = ['page', 'limit', 'sort', 'search', 'q', 'fields'];
    const raw = { ...this.queryString };
    excluded.forEach((key) => delete raw[key]);

    const filters = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (allowedFields.length && !allowedFields.includes(key)) return;
      if (value === '' || value === undefined) return;

      if (typeof value === 'object' && value !== null) {
        // { gte: '10', lte: '50' }  ->  { $gte: 10, $lte: 50 }
        const range = {};
        Object.entries(value).forEach(([op, opValue]) => {
          const map = { gte: '$gte', gt: '$gt', lte: '$lte', lt: '$lt', ne: '$ne', in: '$in' };
          if (map[op]) range[map[op]] = op === 'in' ? String(opValue).split(',') : opValue;
        });
        filters[key] = range;
      } else if (value === 'true' || value === 'false') {
        filters[key] = value === 'true';
      } else if (!Number.isNaN(Number(value)) && String(value).trim() !== '') {
        filters[key] = Number(value);
      } else {
        filters[key] = value;
      }
    });

    this.query = this.query.find(filters);
    return this;
  }

  /** ?sort=-price | ?sort=rating | default: newest first */
  sort(defaultSort = '-createdAt') {
    const sortBy = this.queryString.sort
      ? String(this.queryString.sort).split(',').join(' ')
      : defaultSort;
    this.query = this.query.sort(sortBy);
    return this;
  }

  /** Select specific fields: ?fields=name,price */
  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(String(this.queryString.fields).split(',').join(' '));
    }
    return this;
  }

  /** ?page=2&limit=12 */
  paginate() {
    this.limit = Math.min(Math.max(this.limit, 1), 100); // hard cap
    const skip = (this.page - 1) * this.limit;
    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }

  /** Run a `countDocuments` with the same filters (used for pagination meta). */
  async countTotal(model, filterQuery = null) {
    const filter = filterQuery || this.query.getFilter();
    return model.countDocuments(filter);
  }
}

module.exports = ApiFeatures;
