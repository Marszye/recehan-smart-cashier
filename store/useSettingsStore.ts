import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreInfo } from '@/types';
import { supabase } from '@/lib/supabase';

interface SettingsState {
  storeInfo: StoreInfo;
  lastBackup: number | null;
  nightMode: boolean;
  busyMode: boolean;
  silentMode: boolean;
  batterySaverMode: boolean;
  receiptTemplate: string;
  customReceiptText: string;
  receiptHeaderImage: string;
  syncId: string | null;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  setLastBackup: (timestamp: number) => void;
  toggleNightMode: () => void;
  toggleBusyMode: () => void;
  toggleSilentMode: () => void;
  toggleBatterySaverMode: () => void;
  setReceiptTemplate: (template: string) => void;
  setCustomReceiptText: (text: string) => void;
  setReceiptHeaderImage: (image: string) => void;
  generateSyncId: () => void;
  uploadToCloud: () => Promise<{ success: boolean; message: string }>;
  downloadFromCloud: (syncId: string) => Promise<{ success: boolean; message: string }>;
}

// Generate unique sync ID
const generateUniqueId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `RCH-${timestamp}-${randomStr}`.toUpperCase();
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      storeInfo: {
        name: "Recehan",
        address: "",
        phone: "",
        note: "",
        qrisImage: "",
        adminName: "Admin",
        logo: "",
      },
      lastBackup: null,
      nightMode: false,
      busyMode: false,
      silentMode: false,
      batterySaverMode: false,
      receiptTemplate: 'classic',
      customReceiptText: `{STORE_NAME}
{STORE_ADDRESS}
{STORE_PHONE}

Tanggal: {DATE}
Kasir: {CASHIER}
No: {TRANSACTION_ID}

{ITEMS}

Total: {TOTAL}
Bayar: {PAID}
Kembali: {CHANGE}

Terima kasih atas kunjungan Anda!`,
      receiptHeaderImage: "",
      syncId: null,
      
      updateStoreInfo: (info) => {
        set((state) => ({
          storeInfo: { ...state.storeInfo, ...info },
        }));
      },
      
      setLastBackup: (timestamp) => {
        set({ lastBackup: timestamp });
      },

      toggleNightMode: () => {
        set((state) => ({ nightMode: !state.nightMode }));
      },

      toggleBusyMode: () => {
        set((state) => ({ busyMode: !state.busyMode }));
      },

      toggleSilentMode: () => {
        set((state) => ({ silentMode: !state.silentMode }));
      },

      toggleBatterySaverMode: () => {
        set((state) => ({ batterySaverMode: !state.batterySaverMode }));
      },

      setReceiptTemplate: (template) => {
        set({ receiptTemplate: template });
      },

      setCustomReceiptText: (text) => {
        set({ customReceiptText: text });
      },

      setReceiptHeaderImage: (image) => {
        set({ receiptHeaderImage: image });
      },

      generateSyncId: () => {
        const newSyncId = generateUniqueId();
        set({ syncId: newSyncId });
      },

      uploadToCloud: async () => {
        try {
          const state = get();
          if (!state.syncId) {
            return { success: false, message: "ID Sinkronisasi belum dibuat" };
          }

          // Get all store data from AsyncStorage
          const productsData = await AsyncStorage.getItem('recehan-products');
          const transactionsData = await AsyncStorage.getItem('recehan-transactions');
          const customersData = await AsyncStorage.getItem('recehan-customers');
          const debtsData = await AsyncStorage.getItem('recehan-debts');
          const authData = await AsyncStorage.getItem('recehan-auth');

          const allData = {
            settings: state,
            products: productsData ? JSON.parse(productsData) : null,
            transactions: transactionsData ? JSON.parse(transactionsData) : null,
            customers: customersData ? JSON.parse(customersData) : null,
            debts: debtsData ? JSON.parse(debtsData) : null,
            auth: authData ? JSON.parse(authData) : null,
            timestamp: Date.now(),
          };

          // Check if record exists
          const { data: existingData, error: checkError } = await supabase
            .from('recehan_sync')
            .select('id')
            .eq('sync_id', state.syncId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Check error:', checkError);
            return { success: false, message: "Gagal memeriksa data existing" };
          }

          let result;
          if (existingData) {
            // Update existing record
            result = await supabase
              .from('recehan_sync')
              .update({
                data: allData,
                updated_at: new Date().toISOString(),
              })
              .eq('sync_id', state.syncId);
          } else {
            // Insert new record
            result = await supabase
              .from('recehan_sync')
              .insert({
                sync_id: state.syncId,
                data: allData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }

          if (result.error) {
            console.error('Upload error:', result.error);
            return { success: false, message: `Gagal upload: ${result.error.message}` };
          }

          set({ lastBackup: Date.now() });
          return { success: true, message: "Data berhasil diupload ke cloud" };
        } catch (error) {
          console.error('Upload error:', error);
          return { success: false, message: "Terjadi kesalahan saat upload" };
        }
      },

      downloadFromCloud: async (syncId: string) => {
        try {
          // Download from Supabase
          const { data, error } = await supabase
            .from('recehan_sync')
            .select('*')
            .eq('sync_id', syncId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error('Download error:', error);
            return { success: false, message: "ID Sinkronisasi tidak ditemukan" };
          }

          if (!data) {
            return { success: false, message: "Data tidak ditemukan" };
          }

          const syncData = data.data;

          // Restore all data to AsyncStorage
          if (syncData.products) {
            await AsyncStorage.setItem('recehan-products', JSON.stringify(syncData.products));
          }
          if (syncData.transactions) {
            await AsyncStorage.setItem('recehan-transactions', JSON.stringify(syncData.transactions));
          }
          if (syncData.customers) {
            await AsyncStorage.setItem('recehan-customers', JSON.stringify(syncData.customers));
          }
          if (syncData.debts) {
            await AsyncStorage.setItem('recehan-debts', JSON.stringify(syncData.debts));
          }
          if (syncData.auth) {
            await AsyncStorage.setItem('recehan-auth', JSON.stringify(syncData.auth));
          }

          // Update current settings
          if (syncData.settings) {
            const settings = syncData.settings;
            set({
              storeInfo: settings.storeInfo || get().storeInfo,
              nightMode: settings.nightMode || false,
              busyMode: settings.busyMode || false,
              silentMode: settings.silentMode || false,
              batterySaverMode: settings.batterySaverMode || false,
              receiptTemplate: settings.receiptTemplate || 'classic',
              customReceiptText: settings.customReceiptText || get().customReceiptText,
              receiptHeaderImage: settings.receiptHeaderImage || '',
              syncId: syncId, // Use the downloaded sync ID
            });
          }

          return { success: true, message: "Data berhasil disinkronisasi" };
        } catch (error) {
          console.error('Download error:', error);
          return { success: false, message: "Terjadi kesalahan saat download" };
        }
      },
    }),
    {
      name: 'recehan-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);