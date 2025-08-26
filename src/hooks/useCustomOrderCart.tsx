import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface CustomOrderItem {
  category: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  description?: string;
}

interface CustomOrder {
  id: string;
  items: CustomOrderItem[];
  notes: string;
  customer_email?: string;
  customer_discord?: string;
  special_instructions: string;
  total: number;
}

interface CustomOrderCartContextType {
  customOrder: CustomOrder | null;
  setCustomOrder: (order: CustomOrder) => void;
  clearCustomOrder: () => void;
  hasCustomOrder: boolean;
}

const CustomOrderCartContext = createContext<CustomOrderCartContextType | undefined>(undefined);

export function CustomOrderCartProvider({ children }: { children: ReactNode }) {
  const [customOrder, setCustomOrderState] = useState<CustomOrder | null>(null);

  const setCustomOrder = useCallback((order: CustomOrder) => {
    setCustomOrderState(order);
  }, []);

  const clearCustomOrder = useCallback(() => {
    setCustomOrderState(null);
  }, []);

  const hasCustomOrder = useMemo(() => customOrder !== null, [customOrder]);

  const contextValue = useMemo(() => ({
    customOrder,
    setCustomOrder,
    clearCustomOrder,
    hasCustomOrder,
  }), [customOrder, setCustomOrder, clearCustomOrder, hasCustomOrder]);

  return (
    <CustomOrderCartContext.Provider value={contextValue}>
      {children}
    </CustomOrderCartContext.Provider>
  );
}

export function useCustomOrderCart() {
  const context = useContext(CustomOrderCartContext);
  if (context === undefined) {
    throw new Error("useCustomOrderCart must be used within a CustomOrderCartProvider");
  }
  return context;
}
