import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";

// Unified product interface based on the products table
export interface UnifiedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  product_type: "service" | "bundle" | "custom_item";
  category: string;
  subcategory?: string;
  tags?: string[];
  base_price: number;
  sale_price?: number;
  price_per_unit?: number;
  minimum_quantity: number;
  maximum_quantity?: number;
  features?: string[];
  specifications?: Record<string, any>;
  requirements?: string[];
  estimated_duration_hours?: number;
  difficulty_level?: "easy" | "medium" | "hard" | "expert";
  status: "draft" | "active" | "inactive" | "discontinued";
  visibility: "public" | "private" | "hidden";
  featured: boolean;
  popular: boolean;
  bundled_products?: any[];
  bundle_type?: "fixed" | "flexible";
  // Legacy compatibility fields
  title?: string; // maps to name
  price?: number; // calculated from base_price/sale_price
  isBundle?: boolean; // derived from product_type
  duration?: string; // maps to estimated_duration_hours
}

// Unified cart item interface
export interface UnifiedCartItem {
  id: string;
  product: UnifiedProduct;
  quantity: number;
  unit_price: number; // Server-validated price
  total_price: number; // quantity * unit_price
  custom_options?: {
    instructions?: string;
    notes?: string;
    [key: string]: any;
  };
}

interface UnifiedCartContextType {
  items: UnifiedCartItem[];
  cartItems: UnifiedCartItem[]; // Compatibility alias
  addItem: (
    product: UnifiedProduct,
    quantity?: number,
    options?: any,
  ) => Promise<void>;
  addToCart: (product: UnifiedProduct, quantity?: number) => Promise<void>; // Compatibility alias
  removeItem: (productId: string) => void;
  removeFromCart: (productId: string) => void; // Compatibility alias
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemOptions: (productId: string, options: any) => void;
  clearCart: () => void;
  validateAndCleanCart: () => Promise<void>;
  refreshPricing: () => Promise<void>;
  // Calculated values
  subtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  // Compatibility methods
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
}

const UnifiedCartContext = createContext<UnifiedCartContextType | undefined>(
  undefined,
);

export function UnifiedCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UnifiedCartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tax rate (8%)
  const TAX_RATE = 0.08;

  // Safe localStorage operations
  const saveToLocalStorage = useCallback((cartItems: UnifiedCartItem[]) => {
    if (typeof window !== "undefined") {
      try {
        const cartData = {
          items: cartItems,
          timestamp: Date.now(),
          version: "2.0", // Unified version
        };
        localStorage.setItem(
          "helldivers_unified_cart",
          JSON.stringify(cartData),
        );
      } catch (error) {
        console.warn("Failed to save cart to localStorage:", error);
      }
    }
  }, []);

  const loadFromLocalStorage = useCallback((): UnifiedCartItem[] => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem("helldivers_unified_cart");
      if (!saved) {
        // Try to migrate from old cart
        const oldCart = localStorage.getItem("helldivers_cart");
        if (oldCart) {
          console.log("Migrating from old cart system...");
          // Clear old cart after migration attempt
          localStorage.removeItem("helldivers_cart");
        }
        return [];
      }

      const cartData = JSON.parse(saved);

      // Check if cart data is expired (older than 7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - cartData.timestamp > maxAge) {
        localStorage.removeItem("helldivers_unified_cart");
        return [];
      }

      // Validate cart structure
      if (Array.isArray(cartData.items)) {
        return cartData.items.filter(
          (item: any) =>
            item &&
            typeof item.id === "string" &&
            item.product &&
            typeof item.quantity === "number" &&
            item.quantity > 0 &&
            typeof item.unit_price === "number" &&
            typeof item.total_price === "number",
        );
      }

      return [];
    } catch (error) {
      console.warn("Failed to load cart from localStorage:", error);
      if (typeof window !== "undefined") {
        localStorage.removeItem("helldivers_unified_cart");
      }
      return [];
    }
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedItems = loadFromLocalStorage();
    if (savedItems.length > 0) {
      setItems(savedItems);
      // Validate pricing on load
      validatePricing(savedItems);
    }
    setIsHydrated(true);
  }, [loadFromLocalStorage]);

  // Save cart to localStorage whenever items change (but only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToLocalStorage(items);
    }
  }, [items, isHydrated, saveToLocalStorage]);

  // Calculate effective price for a product
  const calculateEffectivePrice = useCallback(
    (product: UnifiedProduct, quantity: number = 1): number => {
      // Use sale_price if available, otherwise base_price
      let unitPrice = product.sale_price || product.base_price;

      // For custom items with price_per_unit, use that instead
      if (product.product_type === "custom_item" && product.price_per_unit) {
        unitPrice = product.base_price + product.price_per_unit * quantity;
      }

      return unitPrice;
    },
    [],
  );

  // Validate pricing against server
  const validatePricing = useCallback(async (cartItems: UnifiedCartItem[]) => {
    if (cartItems.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      const productIds = cartItems.map((item) => item.product.id);

      const response = await fetch("/api/products/validate-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            product_type: item.product.product_type,
          })),
        }),
      });

      if (response.ok) {
        const { validatedItems, invalidItems } = await response.json();

        if (invalidItems.length > 0) {
          // Remove invalid items
          setItems((prev) =>
            prev.filter(
              (item) =>
                !invalidItems.some(
                  (invalid: any) => invalid.product_id === item.product.id,
                ),
            ),
          );

          setError(
            `Removed ${invalidItems.length} item(s) with outdated pricing.`,
          );
          setTimeout(() => setError(null), 5000);
        }

        // Update pricing for valid items
        if (validatedItems.length > 0) {
          setItems((prev) =>
            prev.map((item) => {
              const validated = validatedItems.find(
                (v: any) => v.product_id === item.product.id,
              );
              if (validated) {
                return {
                  ...item,
                  unit_price: validated.unit_price,
                  total_price: validated.total_price,
                };
              }
              return item;
            }),
          );
        }
      } else {
        console.warn("Pricing validation failed:", response.status);
      }
    } catch (error) {
      console.warn("Failed to validate pricing:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add item to cart
  const addItem = useCallback(
    async (
      product: UnifiedProduct,
      quantity: number = 1,
      options?: any,
    ): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        try {
          // Validate quantity constraints
          if (quantity < product.minimum_quantity) {
            throw new Error(
              `Minimum quantity for ${product.name} is ${product.minimum_quantity}`,
            );
          }

          if (product.maximum_quantity && quantity > product.maximum_quantity) {
            throw new Error(
              `Maximum quantity for ${product.name} is ${product.maximum_quantity}`,
            );
          }

          const unitPrice = calculateEffectivePrice(product, quantity);
          const totalPrice = unitPrice * quantity;

          setItems((prev) => {
            const existing = prev.find(
              (item) => item.product.id === product.id,
            );
            let newItems: UnifiedCartItem[];

            if (existing) {
              // Update existing item
              const newQuantity = existing.quantity + quantity;
              const newUnitPrice = calculateEffectivePrice(
                product,
                newQuantity,
              );
              const newTotalPrice = newUnitPrice * newQuantity;

              newItems = prev.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: newQuantity,
                      unit_price: newUnitPrice,
                      total_price: newTotalPrice,
                      custom_options: { ...item.custom_options, ...options },
                    }
                  : item,
              );
            } else {
              // Add new item
              const newItem: UnifiedCartItem = {
                id: product.id,
                product: product,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalPrice,
                custom_options: options || {},
              };
              newItems = [...prev, newItem];
            }

            return newItems;
          });

          // Resolve after state update and validate pricing
          setTimeout(async () => {
            try {
              await validatePricing([]);
              resolve();
            } catch (error) {
              reject(error);
            }
          }, 0);
        } catch (error) {
          reject(error);
        }
      });
    },
    [calculateEffectivePrice, validatePricing],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.product.id === productId) {
            const newUnitPrice = calculateEffectivePrice(
              item.product,
              quantity,
            );
            const newTotalPrice = newUnitPrice * quantity;
            return {
              ...item,
              quantity,
              unit_price: newUnitPrice,
              total_price: newTotalPrice,
            };
          }
          return item;
        }),
      );
    },
    [removeItem, calculateEffectivePrice],
  );

  const updateItemOptions = useCallback((productId: string, options: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, custom_options: { ...item.custom_options, ...options } }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setError(null);
  }, []);

  // Validate cart items against current products and remove invalid ones
  const validateAndCleanCart = useCallback(async () => {
    await validatePricing(items);
  }, [items, validatePricing]);

  const refreshPricing = useCallback(async () => {
    await validatePricing(items);
  }, [items, validatePricing]);

  // Memoize computed values to prevent unnecessary recalculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * TAX_RATE;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Compatibility methods
  const getCartItemCount = useCallback(() => itemCount, [itemCount]);
  const getCartTotal = useCallback(() => total, [total]);
  const addToCart = useCallback(
    async (product: UnifiedProduct, quantity: number = 1) => {
      await addItem(product, quantity);
    },
    [addItem],
  );
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
      updateItemOptions,
      clearCart,
      validateAndCleanCart,
      refreshPricing,
      subtotal,
      taxAmount,
      total,
      itemCount,
      getCartItemCount,
      getCartTotal,
      isHydrated,
      isLoading,
      error,
    }),
    [
      items,
      addItem,
      addToCart,
      removeItem,
      updateQuantity,
      updateItemOptions,
      clearCart,
      validateAndCleanCart,
      refreshPricing,
      subtotal,
      taxAmount,
      total,
      itemCount,
      getCartItemCount,
      getCartTotal,
      isHydrated,
      isLoading,
      error,
    ],
  );

  return (
    <UnifiedCartContext.Provider value={contextValue}>
      {children}
    </UnifiedCartContext.Provider>
  );
}

export function useUnifiedCart() {
  const context = useContext(UnifiedCartContext);
  if (context === undefined) {
    throw new Error("useUnifiedCart must be used within a UnifiedCartProvider");
  }
  return context;
}

// Backward compatibility hook
export const useOptimizedCart = useUnifiedCart;
export const useCustomOrderCart = () => {
  const cart = useUnifiedCart();

  // Legacy compatibility for custom order cart
  return {
    customOrder: null, // Custom orders are now regular cart items
    setCustomOrder: () => Promise.resolve(),
    clearCustomOrder: () => {},
    hasCustomOrder: false,
  };
};
