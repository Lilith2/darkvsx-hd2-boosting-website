import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
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
  validateAndCleanCart: () => Promise<void>;
  total: number;
  itemCount: number;
  getCartItemCount: () => number; // Compatibility method
  getCartTotal: () => number; // Compatibility method
  isHydrated: boolean; // Indicates if cart data has been loaded from localStorage
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function OptimizedCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Safe localStorage operations
  const saveToLocalStorage = useCallback((cartItems: CartItem[]) => {
    if (typeof window !== "undefined") {
      try {
        const cartData = {
          items: cartItems,
          timestamp: Date.now(),
          version: "1.0",
        };
        localStorage.setItem("helldivers_cart", JSON.stringify(cartData));
      } catch (error) {
        console.warn("Failed to save cart to localStorage:", error);
      }
    }
  }, []);

  const loadFromLocalStorage = useCallback((): CartItem[] => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem("helldivers_cart");
      if (!saved) return [];

      const cartData = JSON.parse(saved);

      // Check if cart data is expired (older than 7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - cartData.timestamp > maxAge) {
        localStorage.removeItem("helldivers_cart");
        return [];
      }

      // Validate cart structure
      if (Array.isArray(cartData.items)) {
        return cartData.items.filter(
          (item: any) =>
            item &&
            typeof item.id === "string" &&
            item.service &&
            typeof item.quantity === "number" &&
            item.quantity > 0,
        );
      }

      return [];
    } catch (error) {
      console.warn("Failed to load cart from localStorage:", error);
      // Clear corrupted data
      if (typeof window !== "undefined") {
        localStorage.removeItem("helldivers_cart");
      }
      return [];
    }
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedItems = loadFromLocalStorage();
    if (savedItems.length > 0) {
      setItems(savedItems);
    }
    setIsHydrated(true);
  }, [loadFromLocalStorage]);

  // Save cart to localStorage whenever items change (but only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToLocalStorage(items);
    }
  }, [items, isHydrated, saveToLocalStorage]);

  // Memoize callback functions to prevent unnecessary rerenders
  const addItem = useCallback((service: ServiceData) => {
    return new Promise<void>((resolve) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.service.id === service.id);
        let newItems;
        if (existing) {
          newItems = prev.map((item) =>
            item.service.id === service.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        } else {
          newItems = [
            ...prev,
            {
              id: service.id,
              service,
              quantity: 1,
            },
          ];
        }

        // Resolve after state update
        setTimeout(() => resolve(), 0);
        return newItems;
      });
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.service.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.service.id === id ? { ...item, quantity } : item,
        ),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Validate cart items against current services and remove invalid ones
  const validateAndCleanCart = useCallback(async () => {
    if (items.length === 0) return;

    try {
      // Separate regular services/bundles from special items (like custom orders)
      const regularItems = items.filter(
        (item) =>
          !item.service.id.startsWith("custom-order-") &&
          !item.service.isBundle
      );

      const bundleItems = items.filter(
        (item) => item.service.isBundle === true
      );

      const customOrderItems = items.filter(
        (item) => item.service.id.startsWith("custom-order-")
      );

      // Only validate regular services and bundles if there are any
      if (regularItems.length > 0 || bundleItems.length > 0) {
        const serviceIds = [
          ...regularItems.map((item) => item.service.id),
          ...bundleItems.map((item) => item.service.id),
        ];

        const response = await fetch("/api/services/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceIds: serviceIds,
          }),
        });

        if (response.ok) {
          const { validServiceIds, invalidServiceIds } = await response.json();

          if (invalidServiceIds.length > 0) {
            // Remove only the invalid regular items, keep custom orders
            setItems((prev) =>
              prev.filter((item) => {
                // Keep custom orders always
                if (item.service.id.startsWith("custom-order-")) return true;
                // Keep valid services/bundles
                return validServiceIds.includes(item.service.id);
              }),
            );

            console.warn(
              "Removed invalid services from cart:",
              invalidServiceIds,
            );
          }
        } else {
          console.warn("Service validation request failed:", response.status);
        }
      }
    } catch (error) {
      console.warn("Failed to validate cart:", error);
      // Don't clear cart on network errors, just log the issue
    }
  }, [items]);

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
  const contextValue = useMemo(
    () => ({
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
      isHydrated,
      validateAndCleanCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      getCartItemCount,
      getCartTotal,
      isHydrated,
      validateAndCleanCart,
    ],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useOptimizedCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error(
      "useOptimizedCart must be used within an OptimizedCartProvider",
    );
  }
  return context;
}
