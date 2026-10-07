/**
 * utils/response.js
 * ---------------------------------------------------------
 * Every endpoint answers with the same JSON shape:
 *   success mode: { success: true, message, data, meta? }
 *   error   mode: { success: false, message, errors }
 * which makes the React client trivial to write.
 */

/** 200/201 success response. */
const sendSuccess = (res, data = null, message = 'OK', statusCode = 200, meta = null) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/** 201 created. */
const sendCreated = (res, data, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

/**
 * List response with pagination meta.
 * @param {Array} items documents
 * @param {object} meta  { page, limit, total, totalPages, ... }
 */
const sendList = (res, items, meta, message = 'OK') =>
  sendSuccess(res, items, message, 200, meta);

module.exports = { sendSuccess, sendCreated, sendList };
