import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from "@/constants/colors";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ProductItem } from "@/components/ProductItem";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency, formatCompactCurrency } from "@/utils/formatCurrency";
import { Product } from "@/types";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  X,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Upload,
  Download,
  FileText,
  Tag,
  BarChart3,
  DollarSign,
} from "lucide-react-native";

type SortOption = 'name' | 'price' | 'stock' | 'category';
type SortOrder = 'asc' | 'desc';

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [importing, setImporting] = useState(false);

  const products = useProductStore((state) => state.products);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const importProductsFromCSV = useProductStore((state) => state.importProductsFromCSV);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.sellPrice - b.sellPrice;
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.sellPrice * (product.stock || 0)), 0);
  const lowStockProducts = products.filter(product => (product.stock || 0) < 10).length;
  const outOfStockProducts = products.filter(product => (product.stock || 0) === 0).length;

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    Alert.alert(
      "Hapus Produk",
      `Apakah Anda yakin ingin menghapus "${product.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteProduct(id);
            Alert.alert("Sukses", "Produk berhasil dihapus");
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleAddProduct = () => {
    router.push("/product/new");
  };

  const handleImportCSV = async () => {
    try {
      setImporting(true);
      
      // Use DocumentPicker to select CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        
        const importResult = await importProductsFromCSV(fileContent);
        
        if (importResult.success) {
          Alert.alert(
            "Import Berhasil",
            `${importResult.imported} produk berhasil diimport${importResult.skipped > 0 ? `, ${importResult.skipped} produk dilewati` : ''}.`
          );
        } else {
          Alert.alert("Import Gagal", importResult.error || "Terjadi kesalahan saat import");
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Error", "Gagal mengimport file CSV. Pastikan file yang dipilih adalah format CSV yang valid.");
    } finally {
      setImporting(false);
      setShowActionsModal(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      if (products.length === 0) {
        Alert.alert("Tidak Ada Data", "Tidak ada produk untuk diekspor");
        return;
      }

      // Create CSV content
      const headers = ['Nama,Kode,Harga Beli,Harga Jual,Stok,Kategori'];
      const rows = products.map(product => 
        `"${product.name}","${product.code}","${product.buyPrice}","${product.sellPrice}","${product.stock || ''}","${product.category}"`
      );
      const csvContent = [headers, ...rows].join('\n');

      // Save to file
      const fileName = `produk_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Ekspor Berhasil", `File disimpan sebagai ${fileName}`);
      }
      
      setShowActionsModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Error", "Gagal mengekspor data");
    }
  };

  const handleGenerateLabels = () => {
    if (filteredProducts.length === 0) {
      Alert.alert("Tidak Ada Data", "Tidak ada produk untuk dibuat label");
      return;
    }
    
    Alert.alert(
      "Generate Label",
      `Buat label untuk ${filteredProducts.length} produk yang ditampilkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Buat Label",
          onPress: () => {
            // Here you would implement label generation
            // For now, just show success message
            Alert.alert("Sukses", "Label berhasil dibuat");
            setShowActionsModal(false);
          },
        },
      ]
    );
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductItem
      product={item}
      onEdit={handleEditProduct}
      onDelete={handleDeleteProduct}
      viewMode={viewMode}
    />
  );

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      {/* Header */}
      <View style={[styles.header, nightMode && styles.headerNight]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Package size={28} color={colors.primary} />
            <Text style={[
              styles.headerTitle, 
              nightMode && styles.headerTitleNight,
              busyMode && styles.headerTitleBusy
            ]}>
              📦 Manajemen Produk
            </Text>
          </View>
          <Text style={[
            styles.headerSubtitle, 
            nightMode && styles.headerSubtitleNight,
            busyMode && styles.headerSubtitleBusy
          ]}>
            Kelola inventori dan stok produk
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, nightMode && styles.statCardNight]}>
              <View style={styles.statIconContainer}>
                <Package size={busyMode ? 24 : 20} color={colors.primary} />
              </View>
              <Text style={[
                styles.statValue, 
                nightMode && styles.statValueNight,
                busyMode && styles.statValueBusy
              ]}>
                {totalProducts}
              </Text>
              <Text style={[
                styles.statLabel, 
                nightMode && styles.statLabelNight,
                busyMode && styles.statLabelBusy
              ]}>
                Total Produk
              </Text>
            </View>
            
            <View style={[styles.statCard, nightMode && styles.statCardNight]}>
              <View style={styles.statIconContainer}>
                <DollarSign size={busyMode ? 24 : 20} color={colors.success} />
              </View>
              <Text style={[
                styles.statValue, 
                nightMode && styles.statValueNight,
                busyMode && styles.statValueBusy
              ]}>
                {formatCompactCurrency(totalValue)}
              </Text>
              <Text style={[
                styles.statLabel, 
                nightMode && styles.statLabelNight,
                busyMode && styles.statLabelBusy
              ]}>
                Nilai Stok
              </Text>
            </View>
            
            <View style={[styles.statCard, nightMode && styles.statCardNight]}>
              <View style={styles.statIconContainer}>
                <AlertTriangle size={busyMode ? 24 : 20} color={colors.warning} />
              </View>
              <Text style={[
                styles.statValue, 
                nightMode && styles.statValueNight,
                busyMode && styles.statValueBusy
              ]}>
                {lowStockProducts}
              </Text>
              <Text style={[
                styles.statLabel, 
                nightMode && styles.statLabelNight,
                busyMode && styles.statLabelBusy
              ]}>
                Stok Rendah
              </Text>
            </View>
          </View>
        </View>

        {/* Search and Controls */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, nightMode && styles.searchInputContainerNight]}>
            <Search size={20} color={nightMode ? colors.gray[400] : colors.gray[500]} />
            <TextInput
              style={[
                styles.searchInput, 
                nightMode && styles.searchInputNight,
                busyMode && styles.searchInputBusy
              ]}
              placeholder="Cari produk..."
              placeholderTextColor={nightMode ? colors.gray[500] : colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={20} color={nightMode ? colors.gray[400] : colors.gray[500]} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.controlButton, 
                nightMode && styles.controlButtonNight,
                busyMode && styles.controlButtonBusy
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={busyMode ? 22 : 18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton, 
                nightMode && styles.controlButtonNight,
                busyMode && styles.controlButtonBusy
              ]}
              onPress={toggleSortOrder}
            >
              {sortOrder === 'asc' ? 
                <SortAsc size={busyMode ? 22 : 18} color={colors.primary} /> : 
                <SortDesc size={busyMode ? 22 : 18} color={colors.primary} />
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton, 
                nightMode && styles.controlButtonNight,
                busyMode && styles.controlButtonBusy
              ]}
              onPress={() => setShowActionsModal(true)}
            >
              <BarChart3 size={busyMode ? 22 : 18} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.viewToggle, nightMode && styles.viewToggleNight]}>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'list' && styles.viewToggleButtonActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <List size={busyMode ? 20 : 16} color={viewMode === 'list' ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'grid' && styles.viewToggleButtonActive
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Grid size={busyMode ? 20 : 16} color={viewMode === 'grid' ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  nightMode && styles.categoryChipNight,
                  busyMode && styles.categoryChipBusy,
                  selectedCategory === item && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    nightMode && styles.categoryChipTextNight,
                    busyMode && styles.categoryChipTextBusy,
                    selectedCategory === item && styles.categoryChipTextActive,
                  ]}
                >
                  {item === "all" ? "Semua" : item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoryList}
          />
        </View>
      </View>

      {/* Products List */}
      <View style={[styles.listContainer, nightMode && styles.listContainerNight]}>
        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={64} color={nightMode ? colors.gray[600] : colors.gray[400]} />
            <Text style={[styles.emptyTitle, nightMode && styles.emptyTitleNight]}>
              {searchQuery || selectedCategory !== "all" ? "Tidak ada produk ditemukan" : "Belum ada produk"}
            </Text>
            <Text style={[styles.emptyText, nightMode && styles.emptyTextNight]}>
              {searchQuery || selectedCategory !== "all" 
                ? "Coba ubah kata kunci pencarian atau filter kategori"
                : "Tambahkan produk pertama Anda untuk memulai"
              }
            </Text>
            {(!searchQuery && selectedCategory === "all") && (
              <Button
                title="Tambah Produk"
                onPress={handleAddProduct}
                style={styles.emptyButton}
                leftElement={<Plus size={16} color="#FFFFFF" />}
              />
            )}
          </View>
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={[
          styles.fab,
          busyMode && styles.fabBusy
        ]} 
        onPress={handleAddProduct}
      >
        <Plus size={busyMode ? 28 : 24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Filter & Urutkan</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>Urutkan berdasarkan:</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'name', label: 'Nama' },
                  { key: 'price', label: 'Harga' },
                  { key: 'stock', label: 'Stok' },
                  { key: 'category', label: 'Kategori' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      nightMode && styles.sortOptionNight,
                      sortBy === option.key && styles.sortOptionActive,
                    ]}
                    onPress={() => setSortBy(option.key as SortOption)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        nightMode && styles.sortOptionTextNight,
                        sortBy === option.key && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Reset"
                  onPress={() => {
                    setSelectedCategory("all");
                    setSortBy('name');
                    setSortOrder('asc');
                    setSearchQuery("");
                  }}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Terapkan"
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Aksi Produk</Text>
              <TouchableOpacity
                onPress={() => setShowActionsModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.actionsList}>
                <TouchableOpacity
                  style={[styles.actionItem, nightMode && styles.actionItemNight]}
                  onPress={handleImportCSV}
                  disabled={importing}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Upload size={24} color={colors.primary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, nightMode && styles.actionTitleNight]}>
                      {importing ? "Mengimport..." : "Import CSV"}
                    </Text>
                    <Text style={[styles.actionDescription, nightMode && styles.actionDescriptionNight]}>
                      Import produk dari file CSV
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, nightMode && styles.actionItemNight]}
                  onPress={handleExportCSV}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.success}15` }]}>
                    <Download size={24} color={colors.success} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, nightMode && styles.actionTitleNight]}>
                      Export CSV
                    </Text>
                    <Text style={[styles.actionDescription, nightMode && styles.actionDescriptionNight]}>
                      Export semua produk ke file CSV
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, nightMode && styles.actionItemNight]}
                  onPress={handleGenerateLabels}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <Tag size={24} color={colors.warning} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, nightMode && styles.actionTitleNight]}>
                      Generate Label
                    </Text>
                    <Text style={[styles.actionDescription, nightMode && styles.actionDescriptionNight]}>
                      Buat label untuk produk yang ditampilkan
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, nightMode && styles.actionItemNight]}
                  onPress={() => {
                    setShowActionsModal(false);
                    handleAddProduct();
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.secondary}15` }]}>
                    <Plus size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, nightMode && styles.actionTitleNight]}>
                      Tambah Produk
                    </Text>
                    <Text style={[styles.actionDescription, nightMode && styles.actionDescriptionNight]}>
                      Buat produk baru secara manual
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
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
  header: {
    backgroundColor: colors.background,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerNight: {
    backgroundColor: colors.gray[800],
    borderBottomColor: colors.gray[700],
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 12,
  },
  headerTitleNight: {
    color: colors.night.text,
  },
  headerTitleBusy: {
    fontSize: 28,
    fontWeight: "900",
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  headerSubtitleNight: {
    color: colors.night.textSecondary,
  },
  headerSubtitleBusy: {
    fontSize: 18,
    fontWeight: "500",
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardNight: {
    backgroundColor: colors.gray[800],
    shadowColor: '#000000',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statValueNight: {
    color: colors.night.text,
  },
  statValueBusy: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: "center",
  },
  statLabelNight: {
    color: colors.gray[400],
  },
  statLabelBusy: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInputContainerNight: {
    backgroundColor: colors.gray[700],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  searchInputNight: {
    color: colors.night.text,
  },
  searchInputBusy: {
    fontSize: 18,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonNight: {
    backgroundColor: colors.gray[700],
  },
  controlButtonBusy: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  viewToggleNight: {
    backgroundColor: colors.gray[700],
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryList: {
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  categoryChipNight: {
    backgroundColor: colors.gray[700],
  },
  categoryChipBusy: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  categoryChipTextNight: {
    color: colors.night.text,
  },
  categoryChipTextBusy: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContainerNight: {
    backgroundColor: colors.gray[900],
  },
  productsList: {
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyTitleNight: {
    color: colors.night.text,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyTextNight: {
    color: colors.gray[400],
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabBusy: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  // Modal Styles
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
    borderBottomColor: colors.gray[200],
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  sectionTitleNight: {
    color: colors.night.text,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  sortOptionNight: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  sortOptionTextNight: {
    color: colors.night.text,
  },
  sortOptionTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  // Actions Modal Styles
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionItemNight: {
    backgroundColor: colors.gray[700],
    shadowColor: '#000000',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  actionTitleNight: {
    color: colors.night.text,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  actionDescriptionNight: {
    color: colors.gray[400],
  },
});