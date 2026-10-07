/**
 * src/context/CartContext.jsx
 * ---------------------------------------------------------
 * Synchronises the server side cart with the UI (badge, cart page ...).
 * The prices always come from the API, never from the browser.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart.api';
import { AuthContext } from './AuthContext';
import { CURRENCY_SYMBOL } from '../config/constants';

export const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  itemsCount: 0,
  warnings: [],
  summary: {
    subtotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
    freeShippingFrom: 200,
    currencySymbol: CURRENCY_SYMBOL,
  },
};

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return null;
    }
    setLoading(true);
    try {
      const response = await cartApi.getCart();
      setCart(response.data);
      return response.data;
    } catch {
      setCart(EMPTY_CART);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Reload the cart when the user logs in / out
  useEffect(() => {
    refresh();
  }, [refresh, user?._id]);

  const addItem = async (payload) => {
    const response = await cartApi.addItem(payload);
    setCart(response.data);
    return response;
  };

  const updateItem = async (itemId, quantity) => {
    const response = await cartApi.updateItem(itemId, quantity);
    setCart(response.data);
    return response;
  };

  const removeItem = async (itemId) => {
    const response = await cartApi.removeItem(itemId);
    setCart(response.data);
    return response;
  };

  const clear = async () => {
    const response = await cartApi.clear();
    setCart(response.data);
    return response;
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      count: cart.itemsCount || 0,
      summary: cart.summary,
      warnings: cart.warnings || [],
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, loading, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
