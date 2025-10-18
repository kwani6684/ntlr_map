import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Admin {
  id: string;
  name: string;
  email: string;
  profile_image_url: string | null;
  instagram_id: string | null;
  created_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  setAuth: (isAuthenticated: boolean, admin: Admin | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,
      setAuth: (isAuthenticated, admin) => set({ isAuthenticated, admin }),
      logout: () => set({ isAuthenticated: false, admin: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
