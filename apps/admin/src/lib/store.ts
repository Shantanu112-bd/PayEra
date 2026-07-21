import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminState {
  accessToken: string | null;
  setAuth: (accessToken: string | null) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAuth: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null }),
    }),
    {
      name: "cryptopay-admin-storage",
    }
  )
);
