/**
 * src/api/client.js
 * ---------------------------------------------------------
 * One axios instance for the whole app:
 *  - adds the JWT token to every request
 *  - turns API errors into a plain "message" (+ field errors)
 *  - logs the user out automatically on a 401
 */
import axios from 'axios';

export const TOKEN_KEY = 'bm_token';
export const USER_KEY = 'bm_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 20000,
});

/* -------------------- Request interceptor -------------------- */
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* -------------------- Response interceptor -------------------- */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Session expired / invalid token -> clean the local session
    if (status === 401) {
      const onAuthRoute = window.location.pathname.startsWith('/login')
        || window.location.pathname.startsWith('/register');
      if (!onAuthRoute) {
        clearToken();
        window.dispatchEvent(new Event('bm:unauthorized'));
      }
    }

    const normalized = new Error(
      data?.message || error.message || 'Something went wrong, please try again'
    );
    normalized.status = status;
    normalized.errors = data?.errors || [];
    return Promise.reject(normalized);
  }
);

/** Small helper: GET/POST/... wrappers that return `data` directly. */
const unwrap = (promise) => promise.then((response) => response.data);

export const api = {
  get: (url, params) => unwrap(client.get(url, { params })),
  post: (url, body, config) => unwrap(client.post(url, body, config)),
  put: (url, body) => unwrap(client.put(url, body)),
  patch: (url, body) => unwrap(client.patch(url, body)),
  delete: (url) => unwrap(client.delete(url)),
};

export default client;
