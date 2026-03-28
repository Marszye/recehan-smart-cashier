import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Linking, 
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card } from "@/components/Card";
import { colors } from "@/constants/colors";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useProductStore } from "@/store/useProductStore";
import { useDebtStore } from "@/store/useDebtStore";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useSupplierStore } from "@/store/useSupplierStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency, formatCompactCurrency } from "@/utils/formatCurrency";
import { getCurrentDate, getWeekRange } from "@/utils/dateUtils";
import { 
  BarChart2, 
  Package, 
  ShoppingCart, 
  HelpCircle, 
  Printer, 
  Star, 
  MessageCircle, 
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Plus,
  Truck
} from "lucide-react-native";
import { Button } from "@/components/Button";

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [todaySales, setTodaySales] = useState({ total: 0, count: 0 });
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; total: number }[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const getDailySales = useTransactionStore((state) => state.getDailySales);
  const getTopProducts = useTransactionStore((state) => state.getTopProducts);
  const transactions = useTransactionStore((state) => state.transactions);
  const products = useProductStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const getTotalDebt = useDebtStore((state) => state.getTotalDebt);
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);
  const currentUser = useAuthStore((state) => state.currentUser);

  const totalDebt = getTotalDebt();

  const loadData = () => {
    const today = getCurrentDate();
    const weekRange = getWeekRange();
    
    // Get today's sales
    const dailySales = getDailySales(today);
    setTodaySales(dailySales);
    
    // Get top products
    const top = getTopProducts(weekRange.start, weekRange.end, 5);
    setTopProducts(top);

    // Check low stock products
    const lowStock = products.filter(
      (product) => product.stock !== undefined && product.stock < 10
    );
    setLowStockCount(lowStock.length);
  };

  useEffect(() => {
    loadData();
  }, [transactions, products]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const navigateToScreen = (screen: string) => {
    router.push(screen);
  };

  const openReviewSite = () => {
    setReviewModalVisible(true);
  };

  const handleContinueToReview = () => {
    setReviewModalVisible(false);
    Linking.openURL("https://morz-review.xyz").catch((err) => {
      Alert.alert("Error", "Could not open the link");
    });
  };

  const joinWhatsAppGroup = () => {
    Linking.openURL("https://chat.whatsapp.com/C7gvpiEBBGwHqv5c20ESSf").catch((err) => {
      Alert.alert("Error", "Could not open WhatsApp");
    });
  };

  const handleQuickCashbon = () => {
    router.push("/(tabs)/debts");
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  const textStyle = [
    styles.text,
    nightMode && styles.textNight
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.greeting, nightMode && styles.greetingNight]}>Selamat Datang! 👋</Text>
            <Text style={[
              styles.storeName, 
              nightMode && styles.storeNameNight,
              busyMode && styles.storeNameBusy
            ]}>
              {currentUser?.name || storeInfo.adminName || "Admin"}
            </Text>
            <Text style={[styles.subGreeting, nightMode && styles.subGreetingNight]}>
              Kelola toko Anda dengan mudah dan efisien
            </Text>
          </View>
          
          <View style={[styles.dateSection, nightMode && styles.dateSectionNight]}>
            <Calendar size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
            <Text style={[styles.dateText, nightMode && styles.dateTextNight]}>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Alert Section */}
        {lowStockCount > 0 && (
          <TouchableOpacity 
            style={[styles.alertCard, nightMode && styles.alertCardNight]}
            onPress={() => navigateToScreen("/(tabs)/products")}
          >
            <View style={styles.alertIcon}>
              <AlertTriangle size={20} color={colors.error} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, nightMode && styles.alertTitleNight]}>Peringatan Stok Rendah</Text>
              <Text style={[styles.alertText, nightMode && styles.alertTextNight]}>
                {lowStockCount} produk memiliki stok kurang dari 10
              </Text>
            </View>
            <ArrowUpRight size={20} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[
              styles.statCard, 
              nightMode && styles.statCardNight,
              busyMode && styles.statCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/reports")}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
                <DollarSign size={busyMode ? 28 : 24} color={colors.success} />
              </View>
              <View style={styles.statTrend}>
                <TrendingUp size={16} color={colors.success} />
              </View>
            </View>
            <Text style={[
              styles.statValue, 
              nightMode && styles.statValueNight,
              busyMode && styles.statValueBusy
            ]}>
              {formatCompactCurrency(todaySales.total)}
            </Text>
            <Text style={[
              styles.statLabel, 
              nightMode && styles.statLabelNight,
              busyMode && styles.statLabelBusy
            ]}>
              Penjualan Hari Ini
            </Text>
            <Text style={[
              styles.statSubtext, 
              nightMode && styles.statSubtextNight,
              busyMode && styles.statSubtextBusy
            ]}>
              {todaySales.count} transaksi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.statCard, 
              nightMode && styles.statCardNight,
              busyMode && styles.statCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/debts")}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
                <CreditCard size={busyMode ? 28 : 24} color={colors.error} />
              </View>
              <View style={styles.statTrend}>
                <TrendingUp size={16} color={colors.error} />
              </View>
            </View>
            <Text style={[
              styles.statValue, 
              nightMode && styles.statValueNight,
              busyMode && styles.statValueBusy
            ]}>
              {formatCompactCurrency(totalDebt)}
            </Text>
            <Text style={[
              styles.statLabel, 
              nightMode && styles.statLabelNight,
              busyMode && styles.statLabelBusy
            ]}>
              Total Hutang
            </Text>
            <Text style={[
              styles.statSubtext, 
              nightMode && styles.statSubtextNight,
              busyMode && styles.statSubtextBusy
            ]}>
              Belum lunas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Cards */}
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={[
              styles.quickAccessCard, 
              nightMode && styles.quickAccessCardNight,
              busyMode && styles.quickAccessCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/customers")}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={busyMode ? 28 : 24} color={colors.primary} />
            </View>
            <View style={styles.quickAccessContent}>
              <Text style={[
                styles.quickAccessValue, 
                nightMode && styles.quickAccessValueNight,
                busyMode && styles.quickAccessValueBusy
              ]}>
                {customers.length}
              </Text>
              <Text style={[
                styles.quickAccessLabel, 
                nightMode && styles.quickAccessLabelNight,
                busyMode && styles.quickAccessLabelBusy
              ]}>
                Pelanggan
              </Text>
            </View>
            <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.quickAccessCard, 
              nightMode && styles.quickAccessCardNight,
              busyMode && styles.quickAccessCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/suppliers")}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: `${colors.secondary}15` }]}>
              <Truck size={busyMode ? 28 : 24} color={colors.secondary} />
            </View>
            <View style={styles.quickAccessContent}>
              <Text style={[
                styles.quickAccessValue, 
                nightMode && styles.quickAccessValueNight,
                busyMode && styles.quickAccessValueBusy
              ]}>
                {suppliers.length}
              </Text>
              <Text style={[
                styles.quickAccessLabel, 
                nightMode && styles.quickAccessLabelNight,
                busyMode && styles.quickAccessLabelBusy
              ]}>
                Supplier
              </Text>
            </View>
            <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.quickAccessCard, 
              nightMode && styles.quickAccessCardNight,
              busyMode && styles.quickAccessCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/products")}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: `${colors.secondary}15` }]}>
              <Package size={busyMode ? 28 : 24} color={colors.secondary} />
            </View>
            <View style={styles.quickAccessContent}>
              <Text style={[
                styles.quickAccessValue, 
                nightMode && styles.quickAccessValueNight,
                busyMode && styles.quickAccessValueBusy
              ]}>
                {products.length > 999 ? `${Math.floor(products.length / 1000)}K+` : products.length}
              </Text>
              <Text style={[
                styles.quickAccessLabel, 
                nightMode && styles.quickAccessLabelNight,
                busyMode && styles.quickAccessLabelBusy
              ]}>
                Produk
              </Text>
            </View>
            <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.quickAccessCard, 
              nightMode && styles.quickAccessCardNight,
              busyMode && styles.quickAccessCardBusy
            ]}
            onPress={() => navigateToScreen("/(tabs)/pos")}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: `${colors.primary}15` }]}>
              <ShoppingCart size={busyMode ? 28 : 24} color={colors.primary} />
            </View>
            <View style={styles.quickAccessContent}>
              <Text style={[
                styles.quickAccessValue, 
                nightMode && styles.quickAccessValueNight,
                busyMode && styles.quickAccessValueBusy
              ]}>
                {transactions.length > 999 ? `${Math.floor(transactions.length / 1000)}K+` : transactions.length}
              </Text>
              <Text style={[
                styles.quickAccessLabel, 
                nightMode && styles.quickAccessLabelNight,
                busyMode && styles.quickAccessLabelBusy
              ]}>
                Transaksi
              </Text>
            </View>
            <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Cashbon Button */}
        <TouchableOpacity 
          style={[
            styles.quickCashbonCard, 
            nightMode && styles.quickCashbonCardNight,
            busyMode && styles.quickCashbonCardBusy
          ]}
          onPress={handleQuickCashbon}
        >
          <View style={styles.quickCashbonIcon}>
            <Plus size={busyMode ? 28 : 24} color="#FFFFFF" />
          </View>
          <View style={styles.quickCashbonContent}>
            <Text style={[
              styles.quickCashbonTitle, 
              nightMode && styles.quickCashbonTitleNight,
              busyMode && styles.quickCashbonTitleBusy
            ]}>
              💼 Kasbon Cepat
            </Text>
            <Text style={[
              styles.quickCashbonSubtitle, 
              nightMode && styles.quickCashbonSubtitleNight,
              busyMode && styles.quickCashbonSubtitleBusy
            ]}>
              Catat hutang pelanggan dengan mudah
            </Text>
          </View>
          <ArrowUpRight size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Top Products Section */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionTitle, 
              nightMode && styles.sectionTitleNight,
              busyMode && styles.sectionTitleBusy
            ]}>
              🏆 Produk Terlaris
            </Text>
            <TouchableOpacity onPress={() => navigateToScreen("/(tabs)/reports")}>
              <Text style={[
                styles.sectionLink,
                busyMode && styles.sectionLinkBusy
              ]}>
                Lihat Semua
              </Text>
            </TouchableOpacity>
          </View>
          {topProducts.length > 0 ? (
            <View style={styles.topProductsList}>
              {topProducts.map((product, index) => (
                <View key={index} style={[styles.topProductItem, nightMode && styles.topProductItemNight]}>
                  <View style={styles.productRank}>
                    <Text style={[
                      styles.rankNumber,
                      busyMode && styles.rankNumberBusy
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.topProductInfo}>
                    <Text style={[
                      styles.topProductName, 
                      nightMode && styles.topProductNameNight,
                      busyMode && styles.topProductNameBusy
                    ]}>
                      {product.name}
                    </Text>
                    <Text style={[
                      styles.topProductQuantity, 
                      nightMode && styles.topProductQuantityNight,
                      busyMode && styles.topProductQuantityBusy
                    ]}>
                      {product.quantity} terjual
                    </Text>
                  </View>
                  <Text style={[
                    styles.topProductTotal,
                    busyMode && styles.topProductTotalBusy
                  ]}>
                    {formatCompactCurrency(product.total)}
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
                Belum ada penjualan
              </Text>
            </View>
          )}
        </Card>

        {/* Help & Support */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[
            styles.sectionTitle, 
            nightMode && styles.sectionTitleNight,
            busyMode && styles.sectionTitleBusy
          ]}>
            🛠️ Bantuan & Dukungan
          </Text>
          <View style={styles.helpLinks}>
            <TouchableOpacity 
              style={[styles.helpLink, nightMode && styles.helpLinkNight]}
              onPress={() => setGuideModalVisible(true)}
            >
              <View style={styles.helpLinkIcon}>
                <HelpCircle size={20} color={colors.primary} />
              </View>
              <View style={styles.helpLinkContent}>
                <Text style={[
                  styles.helpLinkText, 
                  nightMode && styles.helpLinkTextNight,
                  busyMode && styles.helpLinkTextBusy
                ]}>
                  Panduan Penggunaan
                </Text>
                <Text style={[
                  styles.helpLinkSubtext, 
                  nightMode && styles.helpLinkSubtextNight,
                  busyMode && styles.helpLinkSubtextBusy
                ]}>
                  Pelajari cara menggunakan aplikasi
                </Text>
              </View>
              <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.helpLink, nightMode && styles.helpLinkNight]}
              onPress={() => setPrinterModalVisible(true)}
            >
              <View style={styles.helpLinkIcon}>
                <Printer size={20} color={colors.primary} />
              </View>
              <View style={styles.helpLinkContent}>
                <Text style={[
                  styles.helpLinkText, 
                  nightMode && styles.helpLinkTextNight,
                  busyMode && styles.helpLinkTextBusy
                ]}>
                  Setup Printer
                </Text>
                <Text style={[
                  styles.helpLinkSubtext, 
                  nightMode && styles.helpLinkSubtextNight,
                  busyMode && styles.helpLinkSubtextBusy
                ]}>
                  Hubungkan printer thermal
                </Text>
              </View>
              <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.helpLink, nightMode && styles.helpLinkNight]}
              onPress={openReviewSite}
            >
              <View style={styles.helpLinkIcon}>
                <Star size={20} color={colors.secondary} />
              </View>
              <View style={styles.helpLinkContent}>
                <Text style={[
                  styles.helpLinkText, 
                  nightMode && styles.helpLinkTextNight,
                  busyMode && styles.helpLinkTextBusy
                ]}>
                  Review Aplikasi
                </Text>
                <Text style={[
                  styles.helpLinkSubtext, 
                  nightMode && styles.helpLinkSubtextNight,
                  busyMode && styles.helpLinkSubtextBusy
                ]}>
                  Berikan penilaian Anda
                </Text>
              </View>
              <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.helpLink, nightMode && styles.helpLinkNight]}
              onPress={joinWhatsAppGroup}
            >
              <View style={styles.helpLinkIcon}>
                <MessageCircle size={20} color={colors.success} />
              </View>
              <View style={styles.helpLinkContent}>
                <Text style={[
                  styles.helpLinkText, 
                  nightMode && styles.helpLinkTextNight,
                  busyMode && styles.helpLinkTextBusy
                ]}>
                  Grup WhatsApp
                </Text>
                <Text style={[
                  styles.helpLinkSubtext, 
                  nightMode && styles.helpLinkSubtextNight,
                  busyMode && styles.helpLinkSubtextBusy
                ]}>
                  Bergabung dengan komunitas
                </Text>
              </View>
              <ArrowUpRight size={16} color={nightMode ? colors.gray[400] : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Footer */}
        <View style={[styles.footer, nightMode && styles.footerNight]}>
          <Text style={[
            styles.footerText, 
            nightMode && styles.footerTextNight,
            busyMode && styles.footerTextBusy
          ]}>
            Recehan v1.0
          </Text>
          <Text style={[
            styles.footerText, 
            nightMode && styles.footerTextNight,
            busyMode && styles.footerTextBusy
          ]}>
            © 2025 MorzaCode
          </Text>
        </View>
      </ScrollView>

      {/* Usage Guide Modal */}
      <Modal
        visible={guideModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGuideModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Cara Penggunaan</Text>
              <TouchableOpacity
                onPress={() => setGuideModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>1. Menambahkan Produk</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                • Buka menu "Produk" di bagian bawah{"\n"}
                • Tekan tombol "Tambah" di pojok kanan atas{"\n"}
                • Isi informasi produk seperti nama, harga beli, harga jual, dan kategori{"\n"}
                • Tekan "Simpan" untuk menambahkan produk
              </Text>
              
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>2. Melakukan Transaksi</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                • Buka menu "Kasir" di bagian bawah{"\n"}
                • Cari produk dengan mengetik nama atau kode produk{"\n"}
                • Pilih produk dari hasil pencarian{"\n"}
                • Atur jumlah produk yang dibeli{"\n"}
                • Masukkan diskon jika ada{"\n"}
                • Masukkan jumlah uang yang dibayarkan{"\n"}
                • Tekan tombol "Bayar" untuk menyelesaikan transaksi
              </Text>
              
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>3. Melihat Laporan</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                • Buka menu "Laporan" di bagian bawah{"\n"}
                • Pilih periode laporan (harian, mingguan, atau bulanan){"\n"}
                • Lihat ringkasan penjualan dan daftar transaksi{"\n"}
                • Gunakan tombol "Export Laporan" untuk membagikan laporan
              </Text>
              
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>4. Pengaturan Toko</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                • Buka menu "Pengaturan" di bagian bawah{"\n"}
                • Isi informasi toko seperti nama, alamat, dan nomor telepon{"\n"}
                • Informasi ini akan muncul di struk pembayaran
              </Text>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setGuideModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Printer Connection Modal */}
      <Modal
        visible={printerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPrinterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Koneksi Printer</Text>
              <TouchableOpacity
                onPress={() => setPrinterModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>Printer yang Didukung</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                Aplikasi ini mendukung printer thermal Bluetooth 58mm dan 80mm yang kompatibel dengan ESC/POS commands.
              </Text>
              
              <Text style={[styles.guideTitle, nightMode && styles.guideTitleNight]}>Cara Menghubungkan Printer</Text>
              <Text style={[styles.guideText, nightMode && styles.guideTextNight]}>
                1. Pastikan printer dalam keadaan menyala dan mode Bluetooth aktif{"\n"}
                2. Pada perangkat Android, buka Pengaturan {">"} Bluetooth{"\n"}
                3. Cari printer Anda di daftar perangkat yang tersedia{"\n"}
                4. Pilih printer untuk melakukan pairing{"\n"}
                5. Masukkan PIN jika diminta (biasanya 0000 atau 1234){"\n"}
                6. Setelah terhubung, kembali ke aplikasi Recehan{"\n"}
                7. Buka halaman transaksi dan tekan tombol "Print" untuk mencetak struk
              </Text>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPrinterModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Review Aplikasi</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewModalBody}>
              <View style={styles.reviewIconContainer}>
                <Star size={48} color={colors.secondary} />
              </View>
              
              <Text style={[styles.reviewTitle, nightMode && styles.reviewTitleNight]}>
                Bantu Kami Meningkatkan Aplikasi
              </Text>
              
              <Text style={[styles.reviewText, nightMode && styles.reviewTextNight]}>
                Jika ingin mengupload review nanti, gunakan Kode Akses berikut:
              </Text>
              
              <View style={[styles.passwordContainer, nightMode && styles.passwordContainerNight]}>
                <Text style={styles.passwordText}>MorzaCode2025</Text>
              </View>
              
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={handleContinueToReview}
              >
                <Text style={styles.reviewButtonText}>Lanjutkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 40,
  },
  scrollViewBusy: {
    padding: 24,
    paddingTop: 48,
  },
  text: {
    color: colors.text,
  },
  textNight: {
    color: colors.night.text,
  },
  header: {
    marginBottom: 32,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 4,
  },
  greetingNight: {
    color: colors.night.textMuted,
  },
  storeName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  storeNameNight: {
    color: colors.night.text,
  },
  storeNameBusy: {
    fontSize: 32,
    fontWeight: "900",
  },
  subGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  subGreetingNight: {
    color: colors.night.textSecondary,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateSectionNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: "500",
  },
  dateTextNight: {
    color: colors.night.textSecondary,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.error}08`,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertCardNight: {
    backgroundColor: `${colors.error}20`,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.error}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
    marginBottom: 4,
  },
  alertTitleNight: {
    color: colors.error,
  },
  alertText: {
    fontSize: 14,
    color: colors.error,
  },
  alertTextNight: {
    color: colors.error,
  },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statCardNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  statCardBusy: {
    padding: 24,
    borderRadius: 20,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statTrend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.success}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  statValueNight: {
    color: colors.night.text,
  },
  statValueBusy: {
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statLabelNight: {
    color: colors.night.textSecondary,
  },
  statLabelBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  statSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statSubtextNight: {
    color: colors.night.textMuted,
  },
  statSubtextBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 24,
  },
  quickAccessCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: "1%",
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAccessCardNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  quickAccessCardBusy: {
    padding: 20,
    borderRadius: 16,
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickAccessContent: {
    flex: 1,
  },
  quickAccessValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  quickAccessValueNight: {
    color: colors.night.text,
  },
  quickAccessValueBusy: {
    fontSize: 20,
    fontWeight: "800",
  },
  quickAccessLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  quickAccessLabelNight: {
    color: colors.night.textMuted,
  },
  quickAccessLabelBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickCashbonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  quickCashbonCardNight: {
    backgroundColor: `${colors.primary}20`,
  },
  quickCashbonCardBusy: {
    padding: 24,
    borderRadius: 20,
  },
  quickCashbonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickCashbonContent: {
    flex: 1,
  },
  quickCashbonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  quickCashbonTitleNight: {
    color: colors.night.text,
  },
  quickCashbonTitleBusy: {
    fontSize: 20,
    fontWeight: "800",
  },
  quickCashbonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickCashbonSubtitleNight: {
    color: colors.night.textSecondary,
  },
  quickCashbonSubtitleBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  cardNight: {
    backgroundColor: colors.gray[800],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sectionTitleNight: {
    color: colors.night.text,
  },
  sectionTitleBusy: {
    fontSize: 22,
    fontWeight: "800",
  },
  sectionLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  sectionLinkBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  topProductsList: {
    marginTop: 8,
  },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
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
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  topProductNameNight: {
    color: colors.night.text,
  },
  topProductNameBusy: {
    fontSize: 18,
    fontWeight: "700",
  },
  topProductQuantity: {
    fontSize: 14,
    color: colors.textMuted,
  },
  topProductQuantityNight: {
    color: colors.night.textMuted,
  },
  topProductQuantityBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  topProductTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  topProductTotalBusy: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
  emptyTextNight: {
    color: colors.night.textMuted,
  },
  emptyTextBusy: {
    fontSize: 18,
    fontWeight: "600",
  },
  helpLinks: {
    marginTop: 16,
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  helpLinkNight: {
    borderBottomColor: colors.gray[700],
  },
  helpLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  helpLinkContent: {
    flex: 1,
  },
  helpLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  helpLinkTextNight: {
    color: colors.night.text,
  },
  helpLinkTextBusy: {
    fontSize: 18,
    fontWeight: "700",
  },
  helpLinkSubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  helpLinkSubtextNight: {
    color: colors.night.textMuted,
  },
  helpLinkSubtextBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerNight: {
    borderTopColor: colors.gray[700],
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  footerTextNight: {
    color: colors.night.textMuted,
  },
  footerTextBusy: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: "80%",
  },
  modalContentNight: {
    backgroundColor: colors.gray[800],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderNight: {
    borderBottomColor: colors.gray[700],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  modalTitleNight: {
    color: colors.night.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  guideTitleNight: {
    color: colors.night.text,
  },
  guideText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  guideTextNight: {
    color: colors.night.textSecondary,
  },
  modalButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewModalBody: {
    padding: 24,
    alignItems: "center",
  },
  reviewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  reviewTitleNight: {
    color: colors.night.text,
  },
  reviewText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  reviewTextNight: {
    color: colors.night.textSecondary,
  },
  passwordContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
  },
  passwordContainerNight: {
    backgroundColor: colors.gray[700],
  },
  passwordText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  reviewButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});