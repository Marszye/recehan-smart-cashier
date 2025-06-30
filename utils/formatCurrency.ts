export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)} M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)} rb`;
  } else {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
};

export const parseCurrency = (value: string): number => {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d]/g, "");
  return parseInt(cleanValue) || 0;
};