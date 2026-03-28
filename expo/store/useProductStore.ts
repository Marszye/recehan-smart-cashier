import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  error?: string;
}

interface ProductState {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  generateProductCode: () => string;
  importProductsFromCSV: (csvContent: string) => Promise<ImportResult>;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: ['Minuman', 'Makanan', 'Sembako', 'Lainnya'],
      
      addProduct: (productData) => {
        const newProduct: Product = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...productData,
        };
        
        set((state) => ({
          products: [...state.products, newProduct],
        }));
      },
      
      updateProduct: (id, productData) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? { ...product, ...productData, updatedAt: Date.now() }
              : product
          ),
        }));
      },
      
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
      },
      
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, category],
        }));
      },
      
      deleteCategory: (category) => {
        set((state) => ({
          categories: state.categories.filter((c) => c !== category),
        }));
      },
      
      generateProductCode: () => {
        const products = get().products;
        const lastCode = products.length > 0 
          ? Math.max(...products.map(p => parseInt(p.code.replace('P', '')) || 0))
          : 0;
        
        return `P${(lastCode + 1).toString().padStart(4, '0')}`;
      },

      importProductsFromCSV: async (csvContent: string): Promise<ImportResult> => {
        try {
          const lines = csvContent.trim().split('\n');
          
          if (lines.length < 2) {
            return {
              success: false,
              imported: 0,
              skipped: 0,
              error: 'File CSV kosong atau tidak valid'
            };
          }

          // Skip header row
          const dataLines = lines.slice(1);
          const existingProducts = get().products;
          const existingCodes = new Set(existingProducts.map(p => p.code.toLowerCase()));
          const categories = get().categories;
          
          let imported = 0;
          let skipped = 0;
          const newProducts: Product[] = [];

          for (const line of dataLines) {
            if (!line.trim()) continue;

            // Parse CSV line (handle commas in quoted fields)
            const fields = parseCSVLine(line);
            
            if (fields.length < 6) {
              console.warn('Skipping line with insufficient fields:', line);
              skipped++;
              continue;
            }

            const [name, code, buyPriceStr, sellPriceStr, stockStr, category] = fields;

            // Validate required fields
            if (!name?.trim() || !code?.trim() || !buyPriceStr?.trim() || !sellPriceStr?.trim() || !category?.trim()) {
              console.warn('Skipping line with empty required fields:', line);
              skipped++;
              continue;
            }

            // Check if code already exists
            if (existingCodes.has(code.trim().toLowerCase())) {
              console.warn('Skipping duplicate code:', code);
              skipped++;
              continue;
            }

            // Parse numeric values
            const buyPrice = parseFloat(buyPriceStr.replace(/[^\d.-]/g, ''));
            const sellPrice = parseFloat(sellPriceStr.replace(/[^\d.-]/g, ''));
            const stock = stockStr?.trim() ? parseFloat(stockStr.replace(/[^\d.-]/g, '')) : undefined;

            // Validate numeric values
            if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) {
              console.warn('Skipping line with invalid prices:', line);
              skipped++;
              continue;
            }

            if (stock !== undefined && (isNaN(stock) || stock < 0)) {
              console.warn('Skipping line with invalid stock:', line);
              skipped++;
              continue;
            }

            // Validate category
            if (!categories.includes(category.trim())) {
              console.warn('Skipping line with invalid category:', category);
              skipped++;
              continue;
            }

            // Create new product
            const newProduct: Product = {
              id: `${Date.now()}_${imported}`,
              name: name.trim(),
              code: code.trim(),
              buyPrice,
              sellPrice,
              stock,
              category: category.trim(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            newProducts.push(newProduct);
            existingCodes.add(code.trim().toLowerCase());
            imported++;
          }

          // Add all new products to store
          if (newProducts.length > 0) {
            set((state) => ({
              products: [...state.products, ...newProducts],
            }));
          }

          return {
            success: true,
            imported,
            skipped,
          };

        } catch (error) {
          console.error('Error importing CSV:', error);
          return {
            success: false,
            imported: 0,
            skipped: 0,
            error: 'Gagal memproses file CSV. Pastikan format file sudah benar.',
          };
        }
      },
    }),
    {
      name: 'recehan-products',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to parse CSV line with proper comma handling
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
}