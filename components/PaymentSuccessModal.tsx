import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { CheckCircle, X } from 'lucide-react-native';

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  paymentMethod: 'cash' | 'debt' | 'qris';
  total: number;
  change?: number;
  customerName?: string;
  remainingDebt?: number;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  onClose,
  paymentMethod,
  total,
  change,
  customerName,
  remainingDebt,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTitle = () => {
    switch (paymentMethod) {
      case 'cash':
        return 'Pembayaran Tunai Berhasil';
      case 'debt':
        return 'Pembayaran Hutang Berhasil';
      case 'qris':
        return 'Pembayaran QRIS Berhasil';
      default:
        return 'Pembayaran Berhasil';
    }
  };

  const getDetails = () => {
    switch (paymentMethod) {
      case 'cash':
        return (
          <>
            <Text style={styles.detailText}>Total: {formatCurrency(total)}</Text>
            {change !== undefined && (
              <Text style={styles.detailText}>Kembalian: {formatCurrency(change)}</Text>
            )}
          </>
        );
      case 'debt':
        return (
          <>
            <Text style={styles.detailText}>Pelanggan: {customerName}</Text>
            <Text style={styles.detailText}>Total: {formatCurrency(total)}</Text>
            {remainingDebt !== undefined && (
              <Text style={styles.detailText}>Sisa Hutang: {formatCurrency(remainingDebt)}</Text>
            )}
          </>
        );
      case 'qris':
        return (
          <Text style={styles.detailText}>Total: {formatCurrency(total)}</Text>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={24} color={colors.gray[500]} />
          </TouchableOpacity>
          
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          
          <Text style={styles.title}>{getTitle()}</Text>
          
          <View style={styles.detailsContainer}>
            {getDetails()}
          </View>
          
          <Button
            title="Tutup"
            onPress={onClose}
            style={styles.closeButtonStyle}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  successIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButtonStyle: {
    width: '100%',
  },
});