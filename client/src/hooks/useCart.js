import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

/**
 * useCart() -> { cart, count, summary, addItem, updateItem, removeItem, clear }
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};
