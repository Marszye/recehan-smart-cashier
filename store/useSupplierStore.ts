import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Supplier } from '@/types';

interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalDebt' | 'lastPurchase' | 'qualityRating'>) => void;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  updateSupplierStats: (supplierId: string, purchaseAmount: number, debtAmount: number) => void;
  updateSupplierQuality: (supplierId: string, rating: number) => void;
  getTopSuppliers: (limit?: number) => Supplier[];
  searchSuppliers: (query: string) => Supplier[];
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      
      addSupplier: (supplierData) => {
        const newSupplier: Supplier = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalPurchases: 0,
          totalDebt: 0,
          qualityRating: 0,
          ...supplierData,
        };
        
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }));
      },
      
      updateSupplier: (id, supplierData) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === id
              ? { ...supplier, ...supplierData, updatedAt: Date.now() }
              : supplier
          ),
        }));
      },
      
      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        }));
      },
      
      getSupplier: (id) => {
        return get().suppliers.find((supplier) => supplier.id === id);
      },

      updateSupplierStats: (supplierId, purchaseAmount, debtAmount) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === supplierId
              ? {
                  ...supplier,
                  totalPurchases: supplier.totalPurchases + purchaseAmount,
                  totalDebt: supplier.totalDebt + debtAmount,
                  lastPurchase: Date.now(),
                  updatedAt: Date.now(),
                }
              : supplier
          ),
        }));
      },

      updateSupplierQuality: (supplierId, rating) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === supplierId
              ? {
                  ...supplier,
                  qualityRating: rating,
                  updatedAt: Date.now(),
                }
              : supplier
          ),
        }));
      },

      getTopSuppliers: (limit = 10) => {
        return get().suppliers
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, limit);
      },

      searchSuppliers: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().suppliers.filter((supplier) =>
          supplier.name.toLowerCase().includes(lowercaseQuery) ||
          supplier.company.toLowerCase().includes(lowercaseQuery) ||
          (supplier.phone && supplier.phone.includes(query)) ||
          (supplier.email && supplier.email.toLowerCase().includes(lowercaseQuery))
        );
      },
    }),
    {
      name: 'recehan-suppliers',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);