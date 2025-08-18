import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

import { ServiceData } from "./useServices";

interface CartItem {
  id: string;
  service: ServiceData;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  cartItems: CartItem[]; // Compatibility alias
  addItem: (service: ServiceData) => void;
  addToCart: (service: ServiceData) => void; // Compatibility alias
  removeItem: (id: string) => void;
  removeFromCart: (id: string) => void; // Compatibility alias
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  getCartItemCount: () => number; // Compatibility method
  getCartTotal: () => number; // Compatibility method
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function OptimizedCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Memoize callback functions to prevent unnecessary rerenders
  const addItem = useCallback((service: ServiceData) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.service.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: service.id,
          service,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.service.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.service.id === id ? { ...item, quantity } : item,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Memoize computed values to prevent unnecessary recalculations
  const total = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.service.price * item.quantity,
      0,
    );
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Compatibility methods
  const getCartItemCount = useCallback(() => itemCount, [itemCount]);
  const getCartTotal = useCallback(() => total, [total]);
  const addToCart = addItem; // Alias
  const removeFromCart = removeItem; // Alias
  const cartItems = items; // Alias

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    items,
    cartItems,
    addItem,
    addToCart,
    removeItem,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    getCartItemCount,
    getCartTotal,
  }), [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, getCartItemCount, getCartTotal]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useOptimizedCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useOptimizedCart must be used within an OptimizedCartProvider");
  }
  return context;
}
