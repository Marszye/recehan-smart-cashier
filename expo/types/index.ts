export interface Product {
  id: string;
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  stock?: number;
  category: string;
  image?: string;
  supplierId?: string;
  supplierName?: string;
  minStock?: number;
  maxStock?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsUsed?: number;
  createdAt: number;
  storeInfo: StoreInfo;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  birthDate?: number;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: number;
  discountPercentage: number;
  notes?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  createdAt: number;
  updatedAt?: number;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'earned' | 'redeemed';
  points: number;
  transactionId?: string;
  description: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
  products?: string[];
  qualityRating?: number;
  notes?: string;
  totalPurchases: number;
  totalDebt: number;
  lastPurchase?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  remainingDebt: number;
  status: 'pending' | 'received' | 'completed';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  dueDate?: number;
  notes?: string;
  receivedAt?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface PurchaseItem {
  id: string;
  productId?: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  received?: number;
}

export interface SupplierDebt {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseId: string;
  amount: number;
  amountPaid: number;
  remainingDebt: number;
  dueDate?: number;
  status: 'unpaid' | 'paid';
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  amount: number;
  amountPaid: number;
  remainingDebt: number;
  description: string;
  dueDate?: number;
  status: 'paid' | 'unpaid';
  isPaid?: boolean;
  paidAt?: number;
  paymentProof?: string;
  reminders?: DebtReminder[];
  createdAt: number;
  updatedAt: number;
}

export interface DebtReminder {
  id: string;
  debtId: string;
  customerId: string;
  customerName: string;
  sentAt: number;
  status: 'sent' | 'clicked' | 'paid';
  message: string;
  channel: 'whatsapp' | 'sms' | 'email';
}

export interface StoreInfo {
  name: string;
  address?: string;
  phone?: string;
  note?: string;
  qrisImage?: string;
  adminName?: string;
  logo?: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  transactions: number;
  profit: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'owner' | 'cashier';
  createdAt: number;
}