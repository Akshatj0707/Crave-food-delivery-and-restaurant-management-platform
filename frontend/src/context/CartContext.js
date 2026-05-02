import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [serviceMode, setServiceMode] = useState('delivery');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crave_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || '');
        setServiceMode(parsed.serviceMode || 'delivery');
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('crave_cart', JSON.stringify({ items, restaurantId, restaurantName, serviceMode }));
  }, [items, restaurantId, restaurantName, serviceMode]);

  const addItem = (item, restId, restName) => {
    if (restaurantId && restaurantId !== restId) {
      if (!window.confirm(`Your cart has items from "${restaurantName}". Clear cart and add from "${restName}"?`)) return;
      clearCart();
    }

    setRestaurantId(restId);
    setRestaurantName(restName);
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        toast.success('Quantity updated');
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      toast.success(`${item.name} added to cart`);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      if (updated.length === 0) { setRestaurantId(null); setRestaurantName(''); }
      return updated;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) { removeItem(itemId); return; }
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName, serviceMode, setServiceMode,
      addItem, removeItem, updateQuantity, clearCart,
      subtotal, totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
