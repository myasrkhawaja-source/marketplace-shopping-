/**
 * utils/helpers.js
 * ---------------------------------------------------------
 * Tiny framework-agnostic helpers used all over the API.
 */
const slugify = require('slugify');
const { STORE } = require('../config/constants');

/**
 * Turn "Rose Face Cream" into "rose-face-cream-1a2b3c".
 * The random suffix keeps slugs unique for products with the same name.
 */
const makeSlug = (text) => {
  const base = slugify(String(text || ''), { lower: true, strict: true, trim: true }) || 'item';
  const suffix = Math.random().toString(16).slice(2, 8);
  return `${base}-${suffix}`;
};

/**
 * Build the pagination metadata returned with every list endpoint.
 */
const buildPaginationMeta = (page, limit, total) => {
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || STORE.defaultPageSize;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  return {
    page: currentPage,
    limit: perPage,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/** Round money to 2 decimals (avoids 0.30000000000000004). */
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

/** Short, human friendly order number: BM-2026-000123 */
const generateOrderNumber = (sequence) => {
  const year = new Date().getFullYear();
  return `BM-${year}-${String(sequence).padStart(6, '0')}`;
};

/** Remove undefined / null / empty-string keys from an object. */
const pickDefined = (obj = {}) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') acc[key] = value;
    return acc;
  }, {});

/** Escape user input before using it inside a RegExp (search safety). */
const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Days between two dates (used by the dashboards charts). */
const daysBetween = (from, to) =>
  Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));

module.exports = {
  makeSlug,
  buildPaginationMeta,
  money,
  generateOrderNumber,
  pickDefined,
  escapeRegex,
  daysBetween,
};
