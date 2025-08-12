import { useContext } from "react";
import { useAuth } from "./useAuth";

// Create a safe version of useAuth that handles context not being available
export function useSafeAuth() {
  try {
    return useAuth();
  } catch (error) {
    console.warn("Auth context not available, returning default values");
    // Return default values when auth context is not available
    return {
      user: null,
      loading: false,
      login: async () => false,
      register: async () => false,
      logout: async () => {},
      resendConfirmation: async () => false,
      updateProfile: async () => false,
      isAuthenticated: false,
      isAdmin: false,
    };
  }
}
