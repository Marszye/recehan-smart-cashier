import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '@/types';

interface CustomerState {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'membershipLevel' | 'loyaltyPoints' | 'totalSpent' | 'visitCount' | 'discountPercentage' | 'status'>) => void;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  updateCustomerStats: (id: string, transactionAmount: number, pointsEarned: number, pointsUsed?: number) => void;
  getTopCustomers: (limit?: number) => Customer[];
  getInactiveCustomers: (daysThreshold?: number) => Customer[];
  getCustomersWithDebt: () => string[];
  searchCustomers: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      
      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          membershipLevel: 'bronze',
          loyaltyPoints: 0,
          totalSpent: 0,
          visitCount: 0,
          discountPercentage: 0,
          status: 'active',
          ...customerData,
        };
        
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      },
      
      updateCustomer: (id, customerData) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id 
              ? { ...customer, ...customerData, updatedAt: Date.now() } 
              : customer
          ),
        }));
      },
      
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }));
      },
      
      getCustomer: (id) => {
        return get().customers.find((customer) => customer.id === id);
      },

      updateCustomerStats: (id, transactionAmount, pointsEarned, pointsUsed = 0) => {
        set((state) => ({
          customers: state.customers.map((customer) => {
            if (customer.id === id) {
              const newTotalSpent = customer.totalSpent + transactionAmount;
              const newLoyaltyPoints = customer.loyaltyPoints + pointsEarned - pointsUsed;
              const newVisitCount = customer.visitCount + 1;
              
              // Determine membership level based on total spent
              let membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
              let discountPercentage = 0;
              
              if (newTotalSpent >= 10000000) { // 10 juta
                membershipLevel = 'platinum';
                discountPercentage = 10;
              } else if (newTotalSpent >= 5000000) { // 5 juta
                membershipLevel = 'gold';
                discountPercentage = 5;
              } else if (newTotalSpent >= 1000000) { // 1 juta
                membershipLevel = 'silver';
                discountPercentage = 2;
              }
              
              return {
                ...customer,
                totalSpent: newTotalSpent,
                loyaltyPoints: newLoyaltyPoints,
                visitCount: newVisitCount,
                membershipLevel,
                discountPercentage,
                lastVisit: Date.now(),
                updatedAt: Date.now(),
              };
            }
            return customer;
          }),
        }));
      },

      getTopCustomers: (limit = 10) => {
        return get().customers
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, limit);
      },

      getInactiveCustomers: (daysThreshold = 30) => {
        const now = Date.now();
        const thresholdTime = now - (daysThreshold * 24 * 60 * 60 * 1000); // Convert days to milliseconds
        
        return get().customers
          .filter((customer) => 
            customer.status === 'active' && 
            (!customer.lastVisit || customer.lastVisit < thresholdTime)
          )
          .sort((a, b) => {
            // Sort by lastVisit (oldest first)
            const aVisit = a.lastVisit || 0;
            const bVisit = b.lastVisit || 0;
            return aVisit - bVisit;
          });
      },

      getCustomersWithDebt: () => {
        // This function will be used in conjunction with the debt store
        // to identify customers with outstanding debt
        return get().customers
          .filter(customer => customer.status === 'active')
          .map(customer => customer.id);
      },

      searchCustomers: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().customers.filter((customer) =>
          customer.name.toLowerCase().includes(lowercaseQuery) ||
          (customer.phone && customer.phone.includes(query)) ||
          (customer.email && customer.email.toLowerCase().includes(lowercaseQuery))
        );
      },
    }),
    {
      name: 'recehan-customers',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);