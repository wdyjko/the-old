import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    phone: string;
    role: 'elderly' | 'volunteer' | 'admin';
    name?: string;
    points?: number;
    status: string;
}

interface UserState {
    token: string | null;
    user: User | null;
    setAuth: (token: string, user: User) => void;
    updateUser: (userUpdates: Partial<User>) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (token, user) => set({ token, user }),
            updateUser: (userUpdates) => set((state) => ({ 
                user: state.user ? { ...state.user, ...userUpdates } : null 
            })),
            logout: () => set({ token: null, user: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
