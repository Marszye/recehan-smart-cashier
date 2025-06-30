import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Product } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Edit, Trash2, AlertTriangle, TrendingUp, Package } from 'lucide-react-native';

interface ProductItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  viewMode?: 'list' | 'grid';
}

export const ProductItem: React.FC<ProductItemProps> = ({
  product,
  onEdit,
  onDelete,
  viewMode = 'list',
}) => {
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);
  const isLowStock = product.stock !== undefined && product.stock < 10;
  const profit = product.sellPrice - product.buyPrice;
  const profitMargin = ((profit / product.sellPrice) * 100).toFixed(1);

  if (viewMode === 'grid') {
    return (
      <View style={[
        styles.gridContainer, 
        nightMode && styles.gridContainerNight,
        busyMode && styles.gridContainerBusy,
        isLowStock && styles.lowStockContainer
      ]}>
        {product.image && (
          <Image source={{ uri: product.image }} style={styles.gridImage} />
        )}
        
        <View style={styles.gridHeader}>
          <Text style={[
            styles.gridName, 
            nightMode && styles.gridNameNight,
            busyMode && styles.gridNameBusy
          ]} numberOfLines={2}>
            {product.name}
          </Text>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <AlertTriangle size={10} color={colors.error} />
            </View>
          )}
        </View>
        
        <Text style={[
          styles.gridPrice, 
          nightMode && styles.gridPriceNight,
          busyMode && styles.gridPriceBusy
        ]}>
          {formatCompactCurrency(product.sellPrice)}
        </Text>
        
        {product.stock !== undefined && (
          <Text style={[
            styles.gridStock, 
            nightMode && styles.gridStockNight,
            busyMode && styles.gridStockBusy,
            isLowStock && styles.lowStockNumber
          ]}>
            Stok: {product.stock}
          </Text>
        )}
        
        <View style={styles.gridActions}>
          <TouchableOpacity
            style={[
              styles.gridActionButton, 
              styles.editButton,
              busyMode && styles.gridActionButtonBusy
            ]}
            onPress={() => onEdit(product)}
          >
            <Edit size={busyMode ? 16 : 12} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.gridActionButton, 
              styles.deleteButton,
              busyMode && styles.gridActionButtonBusy
            ]}
            onPress={() => onDelete(product.id)}
          >
            <Trash2 size={busyMode ? 16 : 12} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      nightMode && styles.containerNight,
      busyMode && styles.containerBusy,
      isLowStock && styles.lowStockContainer
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.productInfo}>
          {product.image && (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          )}
          <View style={styles.productDetails}>
            <View style={styles.nameRow}>
              <Text style={[
                styles.name, 
                nightMode && styles.nameNight,
                busyMode && styles.nameBusy
              ]}>
                {product.name}
              </Text>
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <AlertTriangle size={12} color={colors.error} />
                  <Text style={styles.lowStockText}>Stok Rendah</Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.code, 
              nightMode && styles.codeNight,
              busyMode && styles.codeBusy
            ]}>
              #{product.code}
            </Text>
          </View>
        </View>
        
        <View style={styles.categoryBadge}>
          <Text style={[
            styles.categoryText,
            busyMode && styles.categoryTextBusy
          ]}>
            {product.category}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.priceSection}>
          <View style={styles.priceItem}>
            <Text style={[
              styles.priceLabel, 
              nightMode && styles.priceLabelNight,
              busyMode && styles.priceLabelBusy
            ]}>
              Harga Jual
            </Text>
            <Text style={[
              styles.sellPrice, 
              nightMode && styles.sellPriceNight,
              busyMode && styles.sellPriceBusy
            ]}>
              {formatCompactCurrency(product.sellPrice)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[
              styles.priceLabel, 
              nightMode && styles.priceLabelNight,
              busyMode && styles.priceLabelBusy
            ]}>
              Harga Beli
            </Text>
            <Text style={[
              styles.buyPrice, 
              nightMode && styles.buyPriceNight,
              busyMode && styles.buyPriceBusy
            ]}>
              {formatCompactCurrency(product.buyPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <TrendingUp size={busyMode ? 20 : 16} color={colors.success} />
            </View>
            <View>
              <Text style={[
                styles.metricValue, 
                nightMode && styles.metricValueNight,
                busyMode && styles.metricValueBusy
              ]}>
                {formatCompactCurrency(profit)}
              </Text>
              <Text style={[
                styles.metricLabel, 
                nightMode && styles.metricLabelNight,
                busyMode && styles.metricLabelBusy
              ]}>
                Profit ({profitMargin}%)
              </Text>
            </View>
          </View>

          {product.stock !== undefined && (
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Package size={busyMode ? 20 : 16} color={isLowStock ? colors.error : colors.primary} />
              </View>
              <View>
                <Text style={[
                  styles.metricValue, 
                  nightMode && styles.metricValueNight,
                  busyMode && styles.metricValueBusy,
                  isLowStock && styles.lowStockNumber
                ]}>
                  {product.stock}
                </Text>
                <Text style={[
                  styles.metricLabel, 
                  nightMode && styles.metricLabelNight,
                  busyMode && styles.metricLabelBusy
                ]}>
                  Stok
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.editButton,
            busyMode && styles.actionButtonBusy
          ]}
          onPress={() => onEdit(product)}
        >
          <Edit size={busyMode ? 20 : 16} color={colors.primary} />
          <Text style={[
            styles.actionButtonText, 
            { color: colors.primary },
            busyMode && styles.actionButtonTextBusy
          ]}>
            Edit
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.deleteButton,
            busyMode && styles.actionButtonBusy
          ]}
          onPress={() => onDelete(product.id)}
        >
          <Trash2 size={busyMode ? 20 : 16} color={colors.error} />
          <Text style={[
            styles.actionButtonText, 
            { color: colors.error },
            busyMode && styles.actionButtonTextBusy
          ]}>
            Hapus
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  containerNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  containerBusy: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  lowStockContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    backgroundColor: `${colors.error}02`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.gray[100],
  },
  productDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  nameNight: {
    color: colors.night.text,
  },
  nameBusy: {
    fontSize: 22,
    fontWeight: '800',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  lowStockText: {
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  code: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  codeNight: {
    color: colors.night.textMuted,
  },
  codeBusy: {
    fontSize: 16,
  },
  categoryBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryTextBusy: {
    fontSize: 14,
  },
  cardBody: {
    marginBottom: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  priceLabelNight: {
    color: colors.night.textMuted,
  },
  priceLabelBusy: {
    fontSize: 14,
  },
  sellPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sellPriceNight: {
    color: colors.night.text,
  },
  sellPriceBusy: {
    fontSize: 18,
  },
  buyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buyPriceNight: {
    color: colors.night.textSecondary,
  },
  buyPriceBusy: {
    fontSize: 18,
  },
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  metricValueNight: {
    color: colors.night.text,
  },
  metricValueBusy: {
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  metricLabelNight: {
    color: colors.night.textMuted,
  },
  metricLabelBusy: {
    fontSize: 14,
  },
  lowStockNumber: {
    color: colors.error,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonBusy: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  editButton: {
    backgroundColor: `${colors.primary}10`,
  },
  deleteButton: {
    backgroundColor: `${colors.error}10`,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonTextBusy: {
    fontSize: 16,
  },
  // Grid styles
  gridContainer: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gridContainerNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  gridContainerBusy: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  gridImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.gray[100],
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  gridNameNight: {
    color: colors.night.text,
  },
  gridNameBusy: {
    fontSize: 16,
    fontWeight: '700',
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  gridPriceNight: {
    color: colors.primary,
  },
  gridPriceBusy: {
    fontSize: 18,
  },
  gridStock: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  gridStockNight: {
    color: colors.night.textMuted,
  },
  gridStockBusy: {
    fontSize: 14,
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridActionButtonBusy: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});