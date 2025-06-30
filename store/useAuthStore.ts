import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

// Default admin user
const defaultOwner: User = {
  id: '1',
  name: 'Admin',
  username: 'admin',
  password: 'admin123',
  role: 'owner',
  createdAt: Date.now(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: [defaultOwner],
      
      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password
        );
        
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        
        return false;
      },
      
      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },
      
      addUser: (userData) => {
        const newUser: User = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          ...userData,
        };
        
        set((state) => ({
          users: [...state.users, newUser],
        }));
      },
      
      updateUser: (id, userData) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...userData } : user
          ),
        }));
      },
      
      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },
    }),
    {
      name: 'recehan-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);