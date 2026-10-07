/**
 * pages/ProductsPage.jsx
 * ---------------------------------------------------------
 * Public catalogue: search + filters + sorting + pagination.
 * The filters live in the URL so a result page can be shared.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog.api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { SORT_OPTIONS, CURRENCY_SYMBOL } from '../config/constants';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  type: '',
  city: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  sort: '-createdAt',
  page: 1,
};

const TYPE_OPTIONS = [
  { value: '', label: 'Everything' },
  { value: 'product', label: '🛍️ Products' },
  { value: 'service', label: '💅 Services' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...Object.fromEntries(searchParams),
  }));
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== '' && value !== null && value !== undefined) acc[key] = value;
          return acc;
        }, {});
        const response = await catalogApi.getProducts(params);
        setProducts(response.data);
        setMeta(response.meta);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  // keep the URL in sync with the filters (shareable links)
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== DEFAULT_FILTERS[key]) params[key] = value;
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const update = (patch) => setFilters((current) => ({ ...current, page: 1, ...patch }));
  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setSearchInput('');
  };

  const activeFiltersCount = useMemo(
    () =>
      ['category', 'type', 'city', 'minPrice', 'maxPrice', 'minRating'].filter(
        (key) => filters[key]
      ).length,
    [filters]
  );

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart', 'info');
      return;
    }
    try {
      const response = await addItem({ productId: product._id, quantity: 1 });
      showToast(response.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>{t.products.pageTitle}</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {meta ? `${meta.total} ${t.products.results}` : t.products.loading}
            {activeFiltersCount > 0 && ` · ${activeFiltersCount} ${t.products.activeFilters}`}
          </p>
        </div>
        <button type="button" className="btn btn-light btn-sm" onClick={clearAll}>
          {t.products.reset}
        </button>
      </div>

      <div className="catalog-layout">
        <aside className="filters">
          <div className="filter-group">
            <h4>{t.products.category}</h4>
            <label className="filter-radio">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => update({ category: '' })}
              />
              {t.products.allCategories}
            </label>
            {categories.map((category) => (
              <label className="filter-radio" key={category._id}>
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category.slug}
                  onChange={() => update({ category: category.slug })}
                />
                {category.icon} {category.name}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>{t.products.type}</h4>
            {TYPE_OPTIONS.map((option) => (
              <label className="filter-radio" key={option.value || 'all'}>
                <input
                  type="radio"
                  name="type"
                  checked={filters.type === option.value}
                  onChange={() => update({ type: option.value })}
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>{t.products.price} ({CURRENCY_SYMBOL})</h4>
            <div className="price-range">
              <input
                type="number"
                min="0"
                placeholder={t.products.min}
                value={filters.minPrice}
                onChange={(event) => update({ minPrice: event.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder={t.products.max}
                value={filters.maxPrice}
                onChange={(event) => update({ maxPrice: event.target.value })}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>Minimum rating</h4>
            {['', '3', '4', '5'].map((value) => (
              <label className="filter-radio" key={value || 'any'}>
                <input
                  type="radio"
                  name="minRating"
                  checked={filters.minRating === value}
                  onChange={() => update({ minRating: value })}
                />
                {value ? `${value}★ and more` : 'Any rating'}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>City</h4>
            <input
              type="text"
              placeholder="e.g. Ramallah"
              value={filters.city}
              onChange={(event) => update({ city: event.target.value })}
            />
          </div>
        </aside>
        <section>
          <div className="toolbar">
            <form
              className="search-box"
              onSubmit={(event) => {
                event.preventDefault();
                update({ search: searchInput });
              }}
            >
              <input
                type="search"
                placeholder="Search for a serum, a perfume, a service…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className="btn btn-sm">Search</button>
            </form>

            <select
              style={{ maxWidth: 220 }}
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading && <Loader label="Loading products…" />}
          {error && <div className="form-error">{error}</div>}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              icon="🧴"
              title="No product matches your filters"
              message="Try another keyword, remove a filter or reset everything."
            />
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="grid grid-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
              <Pagination
                meta={meta}
                onChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductsPage;
