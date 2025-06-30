import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoyaltyTransaction } from '@/types';

interface LoyaltyState {
  loyaltyTransactions: LoyaltyTransaction[];
  pointsPerRupiah: number; // Points earned per rupiah spent
  pointsValue: number; // Rupiah value per point when redeemed
  membershipThresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  membershipDiscounts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  addLoyaltyTransaction: (transaction: Omit<LoyaltyTransaction, 'id' | 'createdAt'>) => void;
  calculatePointsEarned: (amount: number) => number;
  calculatePointsValue: (points: number) => number;
  getMembershipLevel: (totalSpent: number) => 'bronze' | 'silver' | 'gold' | 'platinum';
  getMembershipDiscount: (level: 'bronze' | 'silver' | 'gold' | 'platinum') => number;
  getCustomerLoyaltyHistory: (customerId: string) => LoyaltyTransaction[];
  updateLoyaltySettings: (settings: Partial<{
    pointsPerRupiah: number;
    pointsValue: number;
    membershipThresholds: any;
    membershipDiscounts: any;
  }>) => void;
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      loyaltyTransactions: [],
      pointsPerRupiah: 0.001, // 1 point per 1000 rupiah
      pointsValue: 1000, // 1 point = 1000 rupiah
      membershipThresholds: {
        bronze: 0,
        silver: 1000000, // 1 juta
        gold: 5000000, // 5 juta
        platinum: 10000000, // 10 juta
      },
      membershipDiscounts: {
        bronze: 0,
        silver: 2,
        gold: 5,
        platinum: 10,
      },
      
      addLoyaltyTransaction: (transactionData) => {
        const newTransaction: LoyaltyTransaction = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          ...transactionData,
        };
        
        set((state) => ({
          loyaltyTransactions: [...state.loyaltyTransactions, newTransaction],
        }));
      },
      
      calculatePointsEarned: (amount) => {
        const { pointsPerRupiah } = get();
        return Math.floor(amount * pointsPerRupiah);
      },
      
      calculatePointsValue: (points) => {
        const { pointsValue } = get();
        return points * pointsValue;
      },
      
      getMembershipLevel: (totalSpent) => {
        const { membershipThresholds } = get();
        
        if (totalSpent >= membershipThresholds.platinum) return 'platinum';
        if (totalSpent >= membershipThresholds.gold) return 'gold';
        if (totalSpent >= membershipThresholds.silver) return 'silver';
        return 'bronze';
      },
      
      getMembershipDiscount: (level) => {
        const { membershipDiscounts } = get();
        return membershipDiscounts[level];
      },
      
      getCustomerLoyaltyHistory: (customerId) => {
        return get().loyaltyTransactions.filter(
          (transaction) => transaction.customerId === customerId
        );
      },
      
      updateLoyaltySettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings,
        }));
      },
    }),
    {
      name: 'recehan-loyalty',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);