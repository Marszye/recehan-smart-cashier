import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Transaction } from '@/types';
import { useSettingsStore } from './useSettingsStore';

interface TransactionState {
  transactions: Transaction[];
  cart: CartItem[];
  discount: number;
  amountPaid: number;
  
  addToCart: (item: CartItem) => void;
  updateCartItem: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setDiscount: (amount: number) => void;
  setAmountPaid: (amount: number) => void;
  
  saveTransaction: (cashierId: string, cashierName: string, paymentMethod?: 'cash' | 'debt' | 'qris', extraData?: any) => Transaction;
  getTransaction: (id: string) => Transaction | undefined;
  getCustomerTransactions: (customerId: string) => Transaction[]; // Added this method
  getDailySales: (date: string) => { total: number; count: number };
  getWeeklySales: (startDate: string, endDate: string) => { 
    dates: string[]; 
    totals: number[]; 
    counts: number[] 
  };
  getMonthlySales: (month: number, year: number) => { total: number; count: number };
  getTopProducts: (startDate: string, endDate: string, limit?: number) => { 
    name: string; 
    quantity: number; 
    total: number 
  }[];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      cart: [],
      discount: 0,
      amountPaid: 0,
      
      addToCart: (item) => {
        const cart = get().cart;
        const existingItem = cart.find((cartItem) => cartItem.id === item.id);
        
        if (existingItem) {
          set({
            cart: cart.map((cartItem) =>
              cartItem.id === item.id
                ? {
                    ...cartItem,
                    quantity: cartItem.quantity + item.quantity,
                    subtotal: (cartItem.quantity + item.quantity) * cartItem.sellPrice,
                  }
                : cartItem
            ),
          });
        } else {
          set({
            cart: [...cart, { ...item, subtotal: item.quantity * item.sellPrice }],
          });
        }
      },
      
      updateCartItem: (id, quantity) => {
        const cart = get().cart;
        
        set({
          cart: cart.map((item) =>
            item.id === id
              ? { ...item, quantity, subtotal: quantity * item.sellPrice }
              : item
          ),
        });
      },
      
      removeFromCart: (id) => {
        set({
          cart: get().cart.filter((item) => item.id !== id),
        });
      },
      
      clearCart: () => {
        set({
          cart: [],
          discount: 0,
          amountPaid: 0,
        });
      },
      
      setDiscount: (amount) => {
        set({ discount: amount });
      },
      
      setAmountPaid: (amount) => {
        set({ amountPaid: amount });
      },
      
      saveTransaction: (cashierId, cashierName, paymentMethod = 'cash', extraData = {}) => {
        const { cart, discount, amountPaid } = get();
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const total = subtotal - discount;
        const change = paymentMethod === 'cash' ? amountPaid - total : 0;
        
        const transaction: Transaction = {
          id: Date.now().toString(),
          items: [...cart],
          subtotal,
          discount,
          total,
          paymentMethod,
          amountPaid,
          change,
          cashierId,
          cashierName,
          createdAt: Date.now(),
          storeInfo: useSettingsStore.getState().storeInfo,
          ...extraData,
        };
        
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        }));
        
        return transaction;
      },
      
      getTransaction: (id) => {
        return get().transactions.find((t) => t.id === id);
      },
      
      getCustomerTransactions: (customerId) => {
        return get().transactions.filter((t) => t.customerId === customerId);
      },
      
      getDailySales: (date) => {
        const transactions = get().transactions.filter((t) => {
          const transactionDate = new Date(t.createdAt).toISOString().split('T')[0];
          return transactionDate === date;
        });
        
        return {
          total: transactions.reduce((sum, t) => sum + t.total, 0),
          count: transactions.length,
        };
      },
      
      getWeeklySales: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates: string[] = [];
        const totals: number[] = [];
        const counts: number[] = [];
        
        // Generate array of dates between start and end
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const dateStr = dt.toISOString().split('T')[0];
          dates.push(dateStr);
          
          const dailySales = get().getDailySales(dateStr);
          totals.push(dailySales.total);
          counts.push(dailySales.count);
        }
        
        return { dates, totals, counts };
      },
      
      getMonthlySales: (month, year) => {
        const transactions = get().transactions.filter((t) => {
          const date = new Date(t.createdAt);
          return date.getMonth() === month && date.getFullYear() === year;
        });
        
        return {
          total: transactions.reduce((sum, t) => sum + t.total, 0),
          count: transactions.length,
        };
      },
      
      getTopProducts: (startDate, endDate, limit = 5) => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000; // Add one day to include the end date
        
        const transactions = get().transactions.filter(
          (t) => t.createdAt >= start && t.createdAt <= end
        );
        
        const productMap = new Map<string, { name: string; quantity: number; total: number }>();
        
        transactions.forEach((transaction) => {
          transaction.items.forEach((item) => {
            const existing = productMap.get(item.id);
            
            if (existing) {
              productMap.set(item.id, {
                name: item.name,
                quantity: existing.quantity + item.quantity,
                total: existing.total + item.subtotal,
              });
            } else {
              productMap.set(item.id, {
                name: item.name,
                quantity: item.quantity,
                total: item.subtotal,
              });
            }
          });
        });
        
        return Array.from(productMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, limit);
      },
    }),
    {
      name: 'recehan-transactions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);