import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/dateUtils';
import { colors } from '@/constants/colors';
import { ChevronRight } from 'lucide-react-native';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction)}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.id}>#{transaction.id.slice(-6)}</Text>
        <Text style={styles.date}>{formatDateTime(transaction.createdAt)}</Text>
        <Text style={styles.cashier}>Kasir: {transaction.cashierName}</Text>
        <Text style={styles.items}>
          {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.total}>{formatCurrency(transaction.total)}</Text>
        <ChevronRight size={20} color={colors.gray[500]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContainer: {
    flex: 1,
  },
  id: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  cashier: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  items: {
    fontSize: 14,
    color: colors.gray[600],
  },
  amountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
});