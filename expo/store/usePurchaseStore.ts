import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Purchase, PurchaseItem, SupplierDebt } from '@/types';

interface PurchaseState {
  purchases: Purchase[];
  supplierDebts: SupplierDebt[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Purchase;
  updatePurchase: (id: string, purchaseData: Partial<Purchase>) => void;
  receivePurchase: (id: string, receivedItems: { productId: string; received: number }[]) => void;
  paySupplierDebt: (debtId: string, amount: number) => void;
  getSupplierPurchases: (supplierId: string) => Purchase[];
  getSupplierDebts: (supplierId: string) => SupplierDebt[];
  getTotalSupplierDebt: () => number;
  getOverdueSupplierDebts: () => SupplierDebt[];
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: [],
      supplierDebts: [],
      
      addPurchase: (purchaseData) => {
        const newPurchase: Purchase = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...purchaseData,
        };
        
        // Create supplier debt if there's remaining debt
        if (newPurchase.remainingDebt > 0) {
          const newDebt: SupplierDebt = {
            id: `debt_${newPurchase.id}`,
            supplierId: newPurchase.supplierId,
            supplierName: newPurchase.supplierName,
            purchaseId: newPurchase.id,
            amount: newPurchase.total,
            amountPaid: newPurchase.amountPaid,
            remainingDebt: newPurchase.remainingDebt,
            dueDate: newPurchase.dueDate,
            status: 'unpaid',
            notes: newPurchase.notes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          set((state) => ({
            purchases: [...state.purchases, newPurchase],
            supplierDebts: [...state.supplierDebts, newDebt],
          }));
        } else {
          set((state) => ({
            purchases: [...state.purchases, newPurchase],
          }));
        }
        
        return newPurchase;
      },
      
      updatePurchase: (id, purchaseData) => {
        set((state) => ({
          purchases: state.purchases.map((purchase) =>
            purchase.id === id
              ? { ...purchase, ...purchaseData, updatedAt: Date.now() }
              : purchase
          ),
        }));
      },
      
      receivePurchase: (id, receivedItems) => {
        set((state) => ({
          purchases: state.purchases.map((purchase) => {
            if (purchase.id === id) {
              const updatedItems = purchase.items.map((item) => {
                const receivedItem = receivedItems.find((r) => r.productId === item.id);
                return receivedItem
                  ? { ...item, received: (item.received || 0) + receivedItem.received }
                  : item;
              });
              
              const allReceived = updatedItems.every(
                (item) => (item.received || 0) >= item.quantity
              );
              
              return {
                ...purchase,
                items: updatedItems,
                status: allReceived ? 'completed' : 'received',
                receivedAt: allReceived ? Date.now() : purchase.receivedAt,
                updatedAt: Date.now(),
              };
            }
            return purchase;
          }),
        }));
      },
      
      paySupplierDebt: (debtId, amount) => {
        set((state) => ({
          supplierDebts: state.supplierDebts.map((debt) => {
            if (debt.id === debtId) {
              const newAmountPaid = debt.amountPaid + amount;
              const newRemainingDebt = debt.amount - newAmountPaid;
              const newStatus = newRemainingDebt <= 0 ? 'paid' : 'unpaid';
              
              return {
                ...debt,
                amountPaid: newAmountPaid,
                remainingDebt: newRemainingDebt,
                status: newStatus,
                updatedAt: Date.now(),
              };
            }
            return debt;
          }),
          purchases: state.purchases.map((purchase) => {
            const relatedDebt = state.supplierDebts.find((d) => d.purchaseId === purchase.id);
            if (relatedDebt && relatedDebt.id === debtId) {
              const newAmountPaid = purchase.amountPaid + amount;
              const newRemainingDebt = purchase.total - newAmountPaid;
              const newPaymentStatus = newRemainingDebt <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
              
              return {
                ...purchase,
                amountPaid: newAmountPaid,
                remainingDebt: newRemainingDebt,
                paymentStatus: newPaymentStatus,
                updatedAt: Date.now(),
              };
            }
            return purchase;
          }),
        }));
      },
      
      getSupplierPurchases: (supplierId) => {
        return get().purchases.filter((purchase) => purchase.supplierId === supplierId);
      },
      
      getSupplierDebts: (supplierId) => {
        return get().supplierDebts.filter((debt) => debt.supplierId === supplierId);
      },
      
      getTotalSupplierDebt: () => {
        return get().supplierDebts
          .filter((debt) => debt.status === 'unpaid')
          .reduce((total, debt) => total + debt.remainingDebt, 0);
      },
      
      getOverdueSupplierDebts: () => {
        const now = Date.now();
        return get().supplierDebts.filter(
          (debt) => debt.status === 'unpaid' && debt.dueDate && debt.dueDate < now
        );
      },
    }),
    {
      name: 'recehan-purchases',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);