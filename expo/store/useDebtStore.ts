import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebtPayment, DebtReminder } from '@/types';

interface DebtState {
  debts: DebtPayment[];
  reminders: DebtReminder[];
  addDebt: (debt: Omit<DebtPayment, 'id' | 'createdAt' | 'updatedAt' | 'reminders'>) => DebtPayment;
  updateDebtStatus: (id: string, status: 'paid' | 'unpaid') => void;
  payDebt: (id: string, amount: number, paymentProof?: string) => void;
  getOverdueDebts: () => DebtPayment[];
  getUpcomingDueDebts: (daysThreshold: number) => DebtPayment[];
  getCustomerDebts: (customerId: string) => DebtPayment[];
  getTotalDebt: () => number;
  addReminder: (debtId: string, customerId: string, customerName: string, message: string, channel: 'whatsapp' | 'sms' | 'email') => DebtReminder;
  updateReminderStatus: (id: string, status: 'sent' | 'clicked' | 'paid') => void;
  getDebtReminders: (debtId: string) => DebtReminder[];
  getAllReminders: () => DebtReminder[];
  getRecentReminders: (limit?: number) => DebtReminder[];
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set, get) => ({
      debts: [],
      reminders: [],
      
      addDebt: (debtData) => {
        const newDebt: DebtPayment = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          reminders: [],
          ...debtData,
        };
        
        set((state) => ({
          debts: [...state.debts, newDebt],
        }));
        
        return newDebt;
      },
      
      updateDebtStatus: (id, status) => {
        set((state) => ({
          debts: state.debts.map((debt) =>
            debt.id === id 
              ? { 
                  ...debt, 
                  status, 
                  isPaid: status === 'paid',
                  paidAt: status === 'paid' ? Date.now() : undefined,
                  updatedAt: Date.now() 
                }
              : debt
          ),
        }));
      },
      
      payDebt: (id, amount, paymentProof) => {
        set((state) => ({
          debts: state.debts.map((debt) => {
            if (debt.id === id) {
              const newAmountPaid = debt.amountPaid + amount;
              const newRemainingDebt = debt.amount - newAmountPaid;
              const isPaid = newRemainingDebt <= 0;
              
              return {
                ...debt,
                amountPaid: newAmountPaid,
                remainingDebt: newRemainingDebt,
                status: isPaid ? 'paid' : 'unpaid',
                isPaid,
                paidAt: isPaid ? Date.now() : undefined,
                paymentProof: paymentProof || debt.paymentProof,
                updatedAt: Date.now(),
              };
            }
            return debt;
          }),
        }));

        // If debt is fully paid, update all reminders for this debt to 'paid' status
        const updatedDebt = get().debts.find(debt => debt.id === id);
        if (updatedDebt && updatedDebt.isPaid) {
          set((state) => ({
            reminders: state.reminders.map((reminder) =>
              reminder.debtId === id ? { ...reminder, status: 'paid' } : reminder
            ),
          }));
        }
      },
      
      getOverdueDebts: () => {
        const now = Date.now();
        return get().debts.filter(
          (debt) => debt.status === 'unpaid' && debt.dueDate && debt.dueDate < now
        );
      },

      getUpcomingDueDebts: (daysThreshold) => {
        const now = Date.now();
        const thresholdTime = now + (daysThreshold * 24 * 60 * 60 * 1000); // Convert days to milliseconds
        
        return get().debts.filter(
          (debt) => 
            debt.status === 'unpaid' && 
            debt.dueDate && 
            debt.dueDate > now && 
            debt.dueDate <= thresholdTime
        );
      },
      
      getCustomerDebts: (customerId) => {
        return get().debts.filter((debt) => debt.customerId === customerId);
      },
      
      getTotalDebt: () => {
        return get().debts
          .filter((debt) => debt.status === 'unpaid')
          .reduce((total, debt) => total + debt.remainingDebt, 0);
      },

      addReminder: (debtId, customerId, customerName, message, channel) => {
        const newReminder: DebtReminder = {
          id: Date.now().toString(),
          debtId,
          customerId,
          customerName,
          sentAt: Date.now(),
          status: 'sent',
          message,
          channel,
        };

        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }));

        return newReminder;
      },

      updateReminderStatus: (id, status) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, status } : reminder
          ),
        }));
      },

      getDebtReminders: (debtId) => {
        return get().reminders.filter((reminder) => reminder.debtId === debtId);
      },

      getAllReminders: () => {
        return get().reminders;
      },

      getRecentReminders: (limit = 10) => {
        return get().reminders
          .sort((a, b) => b.sentAt - a.sentAt)
          .slice(0, limit);
      },
    }),
    {
      name: 'recehan-debts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);