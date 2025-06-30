import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CartItem as CartItemType } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const nightMode = useSettingsStore((state) => state.nightMode);

  return (
    <View style={[
      styles.container,
      nightMode && styles.containerNight
    ]}>
      <View style={styles.infoContainer}>
        <Text style={[
          styles.name,
          nightMode && styles.nameNight
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.price,
          nightMode && styles.priceNight
        ]}>
          {formatCurrency(item.sellPrice)}
        </Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            nightMode && styles.quantityButtonNight
          ]}
          onPress={() => {
            if (item.quantity > 1) {
              onUpdateQuantity(item.id, item.quantity - 1);
            }
          }}
        >
          <Minus size={16} color={nightMode ? colors.gray[100] : colors.text} />
        </TouchableOpacity>
        <Text style={[
          styles.quantity,
          nightMode && styles.quantityNight
        ]}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            nightMode && styles.quantityButtonNight
          ]}
          onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Plus size={16} color={nightMode ? colors.gray[100] : colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.subtotalContainer}>
        <Text style={[
          styles.subtotal,
          nightMode && styles.subtotalNight
        ]}>
          {formatCurrency(item.subtotal)}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
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
  containerNight: {
    backgroundColor: colors.gray[800],
  },
  infoContainer: {
    flex: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  nameNight: {
    color: colors.gray[100],
  },
  price: {
    fontSize: 14,
    color: colors.gray[600],
  },
  priceNight: {
    color: colors.gray[400],
  },
  quantityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  quantityButton: {
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    padding: 4,
  },
  quantityButtonNight: {
    backgroundColor: colors.gray[600],
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  quantityNight: {
    color: colors.gray[100],
  },
  subtotalContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtotalNight: {
    color: colors.gray[100],
  },
  removeButton: {
    padding: 4,
  },
});