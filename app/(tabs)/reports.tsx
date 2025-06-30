import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/Card";
import { DatePicker } from "@/components/DatePicker";
import { colors } from "@/constants/colors";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime, getCurrentDate, getWeekRange, getMonthRange } from "@/utils/dateUtils";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Filter,
} from "lucide-react-native";

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

interface ReportData {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  transactions: Array<any>;
  salesTrend: {
    dates: string[];
    totals: number[];
    counts: number[];
  };
}

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [customStartDate, setCustomStartDate] = useState(getCurrentDate());
  const [customEndDate, setCustomEndDate] = useState(getCurrentDate());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getDailySales = useTransactionStore((state) => state.getDailySales);
  const getWeeklySales = useTransactionStore((state) => state.getWeeklySales);
  const getMonthlySales = useTransactionStore((state) => state.getMonthlySales);
  const getTopProducts = useTransactionStore((state) => state.getTopProducts);
  const transactions = useTransactionStore((state) => state.transactions);
  const products = useProductStore((state) => state.products);
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);

  const generateReport = () => {
    try {
      let startDate: string;
      let endDate: string;
      let periodLabel: string;

      switch (selectedPeriod) {
        case 'daily':
          startDate = endDate = getCurrentDate();
          periodLabel = `Harian - ${formatDate(new Date(startDate).getTime())}`;
          break;
        case 'weekly':
          const weekRange = getWeekRange();
          startDate = weekRange.start;
          endDate = weekRange.end;
          periodLabel = `Mingguan - ${formatDate(new Date(startDate).getTime())} s/d ${formatDate(new Date(endDate).getTime())}`;
          break;
        case 'monthly':
          const now = new Date();
          const monthRange = getMonthRange(now.getMonth(), now.getFullYear());
          startDate = monthRange.start;
          endDate = monthRange.end;
          periodLabel = `Bulanan - ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
          break;
        case 'custom':
          startDate = customStartDate;
          endDate = customEndDate;
          periodLabel = `Custom - ${formatDate(new Date(startDate).getTime())} s/d ${formatDate(new Date(endDate).getTime())}`;
          break;
        default:
          startDate = endDate = getCurrentDate();
          periodLabel = `Harian - ${formatDate(new Date(startDate).getTime())}`;
      }

      // Get sales data based on period
      let salesData;
      let salesTrend;

      if (selectedPeriod === 'daily') {
        salesData = getDailySales(startDate);
        salesTrend = {
          dates: [startDate],
          totals: [salesData.total],
          counts: [salesData.count],
        };
      } else if (selectedPeriod === 'weekly') {
        salesTrend = getWeeklySales(startDate, endDate);
        salesData = {
          total: salesTrend.totals.reduce((sum, total) => sum + total, 0),
          count: salesTrend.counts.reduce((sum, count) => sum + count, 0),
        };
      } else if (selectedPeriod === 'monthly') {
        const now = new Date();
        salesData = getMonthlySales(now.getMonth(), now.getFullYear());
        salesTrend = getWeeklySales(startDate, endDate);
      } else {
        // Custom period
        salesTrend = getWeeklySales(startDate, endDate);
        salesData = {
          total: salesTrend.totals.reduce((sum, total) => sum + total, 0),
          count: salesTrend.counts.reduce((sum, count) => sum + count, 0),
        };
      }

      // Get top products
      const topProducts = getTopProducts(startDate, endDate, 10);

      // Filter transactions for the period
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime() + 86400000; // Add one day
      const periodTransactions = transactions.filter(
        (t) => t.createdAt >= startTime && t.createdAt <= endTime
      );

      const averageTransaction = salesData.count > 0 ? salesData.total / salesData.count : 0;

      setReportData({
        period: periodLabel,
        totalSales: salesData.total,
        totalTransactions: salesData.count,
        averageTransaction,
        topProducts,
        transactions: periodTransactions,
        salesTrend,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat membuat laporan');
    }
  };

  useEffect(() => {
    generateReport();
  }, [selectedPeriod, customStartDate, customEndDate, transactions]);

  const onRefresh = () => {
    setRefreshing(true);
    generateReport();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const exportReport = async () => {
    if (!reportData) {
      Alert.alert("Error", "Tidak ada data laporan untuk diekspor");
      return;
    }

    const reportText = `
LAPORAN PENJUALAN
${storeInfo.name}
${reportData.period}

RINGKASAN:
- Total Penjualan: ${formatCurrency(reportData.totalSales)}
- Total Transaksi: ${reportData.totalTransactions}
- Rata-rata per Transaksi: ${formatCurrency(reportData.averageTransaction)}

PRODUK TERLARIS:
${reportData.topProducts.map((product, index) => 
  `${index + 1}. ${product.name} - ${product.quantity} terjual (${formatCurrency(product.total)})`
).join('\n')}

DETAIL TRANSAKSI:
${reportData.transactions.map((transaction, index) => 
  `${index + 1}. ${formatDateTime(transaction.createdAt)} - ${formatCurrency(transaction.total)} - ${transaction.cashierName}`
).join('\n')}

Digenerate pada: ${formatDateTime(Date.now())}
    `.trim();

    try {
      await Share.share({
        message: reportText,
        title: `Laporan Penjualan - ${reportData.period}`,
      });
    } catch (error) {
      Alert.alert("Error", "Gagal mengekspor laporan");
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp size={16} color={colors.success} />;
    } else if (current < previous) {
      return <TrendingDown size={16} color={colors.error} />;
    }
    return null;
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollView,
          busyMode && styles.scrollViewBusy
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[
            styles.title, 
            nightMode && styles.titleNight,
            busyMode && styles.titleBusy
          ]}>
            📊 Laporan Penjualan
          </Text>
          <Text style={[
            styles.subtitle, 
            nightMode && styles.subtitleNight,
            busyMode && styles.subtitleBusy
          ]}>
            Analisis performa bisnis Anda
          </Text>
        </View>

        {/* Period Selection */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <View style={styles.sectionHeader}>
            <Filter size={20} color={colors.primary} />
            <Text style={[
              styles.sectionTitle, 
              nightMode && styles.sectionTitleNight,
              busyMode && styles.sectionTitleBusy
            ]}>
              Periode Laporan
            </Text>
          </View>

          <View style={styles.periodTabs}>
            {[
              { key: 'daily', label: 'Harian' },
              { key: 'weekly', label: 'Mingguan' },
              { key: 'monthly', label: 'Bulanan' },
              { key: 'custom', label: 'Custom' },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodTab,
                  selectedPeriod === period.key && styles.periodTabActive,
                  nightMode && styles.periodTabNight,
                  selectedPeriod === period.key && nightMode && styles.periodTabActiveNight,
                  busyMode && styles.periodTabBusy,
                ]}
                onPress={() => setSelectedPeriod(period.key as ReportPeriod)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.periodTabText,
                  selectedPeriod === period.key && styles.periodTabTextActive,
                  nightMode && styles.periodTabTextNight,
                  selectedPeriod === period.key && nightMode && styles.periodTabTextActiveNight,
                  busyMode && styles.periodTabTextBusy,
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPeriod === 'custom' && (
            <View style={styles.customDateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={[
                  styles.dateLabel, 
                  nightMode && styles.dateLabelNight,
                  busyMode && styles.dateLabelBusy
                ]}>
                  Tanggal Mulai:
                </Text>
                <DatePicker
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  placeholder="Pilih tanggal mulai"
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={[
                  styles.dateLabel, 
                  nightMode && styles.dateLabelNight,
                  busyMode && styles.dateLabelBusy
                ]}>
                  Tanggal Selesai:
                </Text>
                <DatePicker
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  placeholder="Pilih tanggal selesai"
                />
              </View>
            </View>
          )}
        </Card>

        {/* Report Summary */}
        {reportData && (
          <>
            <Card variant="luxury" style={nightMode && styles.cardNight}>
              <View style={styles.sectionHeader}>
                <BarChart2 size={20} color={colors.primary} />
                <Text style={[
                  styles.sectionTitle, 
                  nightMode && styles.sectionTitleNight,
                  busyMode && styles.sectionTitleBusy
                ]}>
                  Ringkasan - {reportData.period}
                </Text>
              </View>

              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, nightMode && styles.summaryCardNight]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${colors.success}15` }]}>
                    <DollarSign size={busyMode ? 28 : 24} color={colors.success} />
                  </View>
                  <Text style={[
                    styles.summaryValue, 
                    nightMode && styles.summaryValueNight,
                    busyMode && styles.summaryValueBusy
                  ]}>
                    {formatCurrency(reportData.totalSales)}
                  </Text>
                  <Text style={[
                    styles.summaryLabel, 
                    nightMode && styles.summaryLabelNight,
                    busyMode && styles.summaryLabelBusy
                  ]}>
                    Total Penjualan
                  </Text>
                </View>

                <View style={[styles.summaryCard, nightMode && styles.summaryCardNight]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <ShoppingCart size={busyMode ? 28 : 24} color={colors.primary} />
                  </View>
                  <Text style={[
                    styles.summaryValue, 
                    nightMode && styles.summaryValueNight,
                    busyMode && styles.summaryValueBusy
                  ]}>
                    {reportData.totalTransactions}
                  </Text>
                  <Text style={[
                    styles.summaryLabel, 
                    nightMode && styles.summaryLabelNight,
                    busyMode && styles.summaryLabelBusy
                  ]}>
                    Total Transaksi
                  </Text>
                </View>

                <View style={[styles.summaryCard, nightMode && styles.summaryCardNight]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${colors.secondary}15` }]}>
                    <Users size={busyMode ? 28 : 24} color={colors.secondary} />
                  </View>
                  <Text style={[
                    styles.summaryValue, 
                    nightMode && styles.summaryValueNight,
                    busyMode && styles.summaryValueBusy
                  ]}>
                    {formatCurrency(reportData.averageTransaction)}
                  </Text>
                  <Text style={[
                    styles.summaryLabel, 
                    nightMode && styles.summaryLabelNight,
                    busyMode && styles.summaryLabelBusy
                  ]}>
                    Rata-rata Transaksi
                  </Text>
                </View>

                <View style={[styles.summaryCard, nightMode && styles.summaryCardNight]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <Package size={busyMode ? 28 : 24} color={colors.warning} />
                  </View>
                  <Text style={[
                    styles.summaryValue, 
                    nightMode && styles.summaryValueNight,
                    busyMode && styles.summaryValueBusy
                  ]}>
                    {reportData.topProducts.length}
                  </Text>
                  <Text style={[
                    styles.summaryLabel, 
                    nightMode && styles.summaryLabelNight,
                    busyMode && styles.summaryLabelBusy
                  ]}>
                    Produk Terjual
                  </Text>
                </View>
              </View>
            </Card>

            {/* Top Products */}
            <Card variant="luxury" style={nightMode && styles.cardNight}>
              <View style={styles.sectionHeader}>
                <Package size={20} color={colors.primary} />
                <Text style={[
                  styles.sectionTitle, 
                  nightMode && styles.sectionTitleNight,
                  busyMode && styles.sectionTitleBusy
                ]}>
                  Produk Terlaris
                </Text>
              </View>

              {reportData.topProducts.length > 0 ? (
                <View style={styles.topProductsList}>
                  {reportData.topProducts.map((product, index) => (
                    <View key={index} style={[styles.topProductItem, nightMode && styles.topProductItemNight]}>
                      <View style={styles.productRank}>
                        <Text style={[
                          styles.rankNumber,
                          busyMode && styles.rankNumberBusy
                        ]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={[
                          styles.productName, 
                          nightMode && styles.productNameNight,
                          busyMode && styles.productNameBusy
                        ]}>
                          {product.name}
                        </Text>
                        <Text style={[
                          styles.productQuantity, 
                          nightMode && styles.productQuantityNight,
                          busyMode && styles.productQuantityBusy
                        ]}>
                          {product.quantity} terjual
                        </Text>
                      </View>
                      <Text style={[
                        styles.productTotal,
                        busyMode && styles.productTotalBusy
                      ]}>
                        {formatCurrency(product.total)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Package size={48} color={nightMode ? colors.gray[600] : colors.textMuted} />
                  <Text style={[
                    styles.emptyText, 
                    nightMode && styles.emptyTextNight,
                    busyMode && styles.emptyTextBusy
                  ]}>
                    Tidak ada produk terjual pada periode ini
                  </Text>
                </View>
              )}
            </Card>

            {/* Recent Transactions */}
            <Card variant="luxury" style={nightMode && styles.cardNight}>
              <View style={styles.sectionHeader}>
                <FileText size={20} color={colors.primary} />
                <Text style={[
                  styles.sectionTitle, 
                  nightMode && styles.sectionTitleNight,
                  busyMode && styles.sectionTitleBusy
                ]}>
                  Transaksi Terbaru ({reportData.transactions.length})
                </Text>
              </View>

              {reportData.transactions.length > 0 ? (
                <View style={styles.transactionsList}>
                  {reportData.transactions.slice(0, 10).map((transaction, index) => (
                    <View key={transaction.id} style={[styles.transactionItem, nightMode && styles.transactionItemNight]}>
                      <View style={styles.transactionInfo}>
                        <Text style={[
                          styles.transactionId, 
                          nightMode && styles.transactionIdNight,
                          busyMode && styles.transactionIdBusy
                        ]}>
                          #{transaction.id}
                        </Text>
                        <Text style={[
                          styles.transactionDate, 
                          nightMode && styles.transactionDateNight,
                          busyMode && styles.transactionDateBusy
                        ]}>
                          {formatDateTime(transaction.createdAt)}
                        </Text>
                        <Text style={[
                          styles.transactionCashier, 
                          nightMode && styles.transactionCashierNight,
                          busyMode && styles.transactionCashierBusy
                        ]}>
                          Kasir: {transaction.cashierName}
                        </Text>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text style={[
                          styles.transactionTotal,
                          busyMode && styles.transactionTotalBusy
                        ]}>
                          {formatCurrency(transaction.total)}
                        </Text>
                        <Text style={[
                          styles.transactionItems, 
                          nightMode && styles.transactionItemsNight,
                          busyMode && styles.transactionItemsBusy
                        ]}>
                          {transaction.items.length} item
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <FileText size={48} color={nightMode ? colors.gray[600] : colors.textMuted} />
                  <Text style={[
                    styles.emptyText, 
                    nightMode && styles.emptyTextNight,
                    busyMode && styles.emptyTextBusy
                  ]}>
                    Tidak ada transaksi pada periode ini
                  </Text>
                </View>
              )}
            </Card>

            {/* Export Button */}
            <TouchableOpacity
              style={[
                styles.exportButton,
                busyMode && styles.exportButtonBusy
              ]}
              onPress={exportReport}
              activeOpacity={0.8}
            >
              <Download size={20} color="#FFFFFF" />
              <Text style={[
                styles.exportButtonText,
                busyMode && styles.exportButtonTextBusy
              ]}>
                Export Laporan
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  containerNight: {
    backgroundColor: colors.gray[900],
  },
  scrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollViewBusy: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  titleNight: {
    color: colors.night.text,
  },
  titleBusy: {
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  subtitleNight: {
    color: colors.night.textSecondary,
  },
  subtitleBusy: {
    fontSize: 18,
    fontWeight: "500",
  },
  cardNight: {
    backgroundColor: colors.gray[800],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 8,
  },
  sectionTitleNight: {
    color: colors.night.text,
  },
  sectionTitleBusy: {
    fontSize: 20,
    fontWeight: "800",
  },
  periodTabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  periodTabNight: {
    backgroundColor: "transparent",
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabActiveNight: {
    backgroundColor: colors.primary,
  },
  periodTabBusy: {
    paddingVertical: 16,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  periodTabTextNight: {
    color: colors.night.textSecondary,
  },
  periodTabTextActive: {
    color: "#FFFFFF",
  },
  periodTabTextActiveNight: {
    color: "#FFFFFF",
  },
  periodTabTextBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  customDateContainer: {
    gap: 16,
  },
  dateInputContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dateLabelNight: {
    color: colors.night.text,
  },
  dateLabelBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  summaryCard: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryCardNight: {
    backgroundColor: colors.gray[700],
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValueNight: {
    color: colors.night.text,
  },
  summaryValueBusy: {
    fontSize: 18,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  summaryLabelNight: {
    color: colors.night.textMuted,
  },
  summaryLabelBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  topProductsList: {
    gap: 12,
  },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  topProductItemNight: {
    borderBottomColor: colors.gray[700],
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rankNumberBusy: {
    fontSize: 16,
    fontWeight: "800",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  productNameNight: {
    color: colors.night.text,
  },
  productNameBusy: {
    fontSize: 18,
    fontWeight: "700",
  },
  productQuantity: {
    fontSize: 14,
    color: colors.textMuted,
  },
  productQuantityNight: {
    color: colors.night.textMuted,
  },
  productQuantityBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  productTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  productTotalBusy: {
    fontSize: 18,
    fontWeight: "800",
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  transactionItemNight: {
    borderBottomColor: colors.gray[700],
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  transactionIdNight: {
    color: colors.night.text,
  },
  transactionIdBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  transactionDateNight: {
    color: colors.night.textMuted,
  },
  transactionDateBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionCashier: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionCashierNight: {
    color: colors.night.textSecondary,
  },
  transactionCashierBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 2,
  },
  transactionTotalBusy: {
    fontSize: 18,
    fontWeight: "800",
  },
  transactionItems: {
    fontSize: 12,
    color: colors.textMuted,
  },
  transactionItemsNight: {
    color: colors.night.textMuted,
  },
  transactionItemsBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: "center",
  },
  emptyTextNight: {
    color: colors.night.textMuted,
  },
  emptyTextBusy: {
    fontSize: 18,
    fontWeight: "600",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonBusy: {
    paddingVertical: 20,
    borderRadius: 16,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exportButtonTextBusy: {
    fontSize: 18,
    fontWeight: "700",
  },
});