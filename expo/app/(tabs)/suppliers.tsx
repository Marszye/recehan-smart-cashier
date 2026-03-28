import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useSupplierStore } from "@/store/useSupplierStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/dateUtils";
import { generateWhatsAppLink, generateSupplierOrderMessage } from "@/utils/whatsappUtils";
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2,
  X,
  Building,
  Mail,
  User,
  MessageCircle,
  Star,
  DollarSign,
  Package,
  FileText,
  Filter,
  ChevronDown,
  ShoppingCart,
  Calendar,
} from "lucide-react-native";
import { Supplier } from "@/types";

export default function SuppliersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [orderProducts, setOrderProducts] = useState([{ name: "", quantity: 1, unit: "pcs" }]);
  const [sortOption, setSortOption] = useState("recent"); // recent, name, purchases

  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const updateSupplier = useSupplierStore((state) => state.updateSupplier);
  const deleteSupplier = useSupplierStore((state) => state.deleteSupplier);
  const updateSupplierQuality = useSupplierStore((state) => state.updateSupplierQuality);
  
  const nightMode = useSettingsStore((state) => state.nightMode);
  const storeInfo = useSettingsStore((state) => state.storeInfo);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    products: "",
    notes: "",
  });

  // Apply search and sorting
  const getFilteredSuppliers = () => {
    let filtered = [...suppliers];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "company":
        filtered.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "purchases":
        filtered.sort((a, b) => b.totalPurchases - a.totalPurchases);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => {
          const aDate = a.lastPurchase || a.createdAt;
          const bDate = b.lastPurchase || b.createdAt;
          return bDate - aDate;
        });
        break;
    }
    
    return filtered;
  };

  const filteredSuppliers = getFilteredSuppliers();

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        company: supplier.company,
        phone: supplier.phone,
        email: supplier.email || "",
        address: supplier.address || "",
        products: supplier.products ? supplier.products.join(", ") : "",
        notes: supplier.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        company: "",
        phone: "",
        email: "",
        address: "",
        products: "",
        notes: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSupplier(null);
    setFormData({
      name: "",
      company: "",
      phone: "",
      email: "",
      address: "",
      products: "",
      notes: "",
    });
  };

  const openDetailsModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedSupplier(null);
  };

  const openOrderModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setOrderProducts([{ name: "", quantity: 1, unit: "pcs" }]);
    setOrderModalVisible(true);
  };

  const closeOrderModal = () => {
    setOrderModalVisible(false);
    setSelectedSupplier(null);
    setOrderProducts([{ name: "", quantity: 1, unit: "pcs" }]);
  };

  const openRatingModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedRating(supplier.qualityRating || 0);
    setRatingModalVisible(true);
  };

  const closeRatingModal = () => {
    setRatingModalVisible(false);
    setSelectedSupplier(null);
    setSelectedRating(0);
  };

  const openFilterModal = () => {
    setFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setFilterModalVisible(false);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.company.trim() || !formData.phone.trim()) {
      Alert.alert("Error", "Nama, perusahaan, dan nomor telepon harus diisi");
      return;
    }

    // Process products string into array
    const productsArray = formData.products
      ? formData.products.split(",").map(item => item.trim()).filter(item => item)
      : undefined;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        ...formData,
        products: productsArray,
      });
      Alert.alert("Sukses", "Data supplier berhasil diperbarui");
    } else {
      addSupplier({
        ...formData,
        products: productsArray,
      });
      Alert.alert("Sukses", "Supplier baru berhasil ditambahkan");
    }
    closeModal();
  };

  const handleDelete = (supplier: Supplier) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus supplier "${supplier.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteSupplier(supplier.id);
            Alert.alert("Sukses", "Supplier berhasil dihapus");
          },
        },
      ]
    );
  };

  const handleSendWhatsApp = (supplier: Supplier) => {
    if (!supplier.phone) {
      Alert.alert("Error", "Supplier tidak memiliki nomor telepon");
      return;
    }

    const message = `Halo ${supplier.name} dari ${supplier.company}, ini dari ${storeInfo.name || "Toko Kami"}. Kami ingin menanyakan ketersediaan produk.`;
    const whatsappLink = generateWhatsAppLink(supplier.phone, message);
    
    Linking.openURL(whatsappLink).catch(err => {
      Alert.alert("Error", "Tidak dapat membuka WhatsApp");
    });
  };

  const handleSendOrder = () => {
    if (!selectedSupplier || !selectedSupplier.phone) {
      Alert.alert("Error", "Supplier tidak memiliki nomor telepon");
      return;
    }

    // Filter out empty product names
    const validProducts = orderProducts.filter(p => p.name.trim() !== "");
    
    if (validProducts.length === 0) {
      Alert.alert("Error", "Masukkan setidaknya satu produk");
      return;
    }

    const message = generateSupplierOrderMessage(
      selectedSupplier.name,
      storeInfo.name || "Toko Kami",
      validProducts
    );

    const whatsappLink = generateWhatsAppLink(selectedSupplier.phone, message);
    
    Linking.openURL(whatsappLink).catch(err => {
      Alert.alert("Error", "Tidak dapat membuka WhatsApp");
    });

    closeOrderModal();
  };

  const handleSaveRating = () => {
    if (!selectedSupplier) return;
    
    updateSupplierQuality(selectedSupplier.id, selectedRating);
    Alert.alert("Sukses", "Penilaian kualitas supplier berhasil disimpan");
    
    if (selectedSupplier) {
      setSelectedSupplier({...selectedSupplier, qualityRating: selectedRating});
    }
    
    closeRatingModal();
  };

  const addProductField = () => {
    setOrderProducts([...orderProducts, { name: "", quantity: 1, unit: "pcs" }]);
  };

  const updateProductField = (index: number, field: string, value: string | number) => {
    const updatedProducts = [...orderProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setOrderProducts(updatedProducts);
  };

  const removeProductField = (index: number) => {
    if (orderProducts.length > 1) {
      const updatedProducts = [...orderProducts];
      updatedProducts.splice(index, 1);
      setOrderProducts(updatedProducts);
    }
  };

  const renderStars = (rating: number, size = 20) => {
    // Ensure rating is a number with a default of 0
    const safeRating = typeof rating === 'number' ? rating : 0;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= safeRating ? colors.warning : "none"}
            color={star <= safeRating ? colors.warning : colors.gray[400]}
          />
        ))}
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: "🚚 Supplier",
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => openModal()}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />

      {/* Search and Filter Bar */}
      <View style={[styles.searchContainer, nightMode && styles.searchContainerNight]}>
        <View style={[styles.searchBar, nightMode && styles.searchBarNight]}>
          <Search size={20} color={nightMode ? colors.gray[400] : colors.textMuted} />
          <TextInput
            style={[styles.searchInput, nightMode && styles.searchInputNight]}
            placeholder="Cari supplier..."
            placeholderTextColor={nightMode ? colors.gray[400] : colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, nightMode && styles.filterButtonNight]}
          onPress={openFilterModal}
        >
          <Filter size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.scrollView, nightMode && styles.scrollViewNight]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <View style={styles.statsHeader}>
            <Truck size={24} color={colors.secondary} />
            <Text style={[styles.statsTitle, nightMode && styles.statsTitleNight]}>
              Total Supplier
            </Text>
          </View>
          <Text style={[styles.statsValue, nightMode && styles.statsValueNight]}>
            {suppliers.length}
          </Text>
          <View style={styles.statsDetails}>
            <View style={styles.statDetail}>
              <Text style={[styles.statDetailValue, nightMode && styles.statDetailValueNight]}>
                {formatCurrency(suppliers.reduce((total, supplier) => total + supplier.totalPurchases, 0))}
              </Text>
              <Text style={[styles.statDetailLabel, nightMode && styles.statDetailLabelNight]}>
                Total Pembelian
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={[styles.statDetailValue, nightMode && styles.statDetailValueNight]}>
                {formatCurrency(suppliers.reduce((total, supplier) => total + supplier.totalDebt, 0))}
              </Text>
              <Text style={[styles.statDetailLabel, nightMode && styles.statDetailLabelNight]}>
                Total Hutang
              </Text>
            </View>
          </View>
        </Card>

        {/* Suppliers List */}
        {filteredSuppliers.length > 0 ? (
          <View style={styles.suppliersList}>
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} style={[styles.supplierCard, nightMode && styles.supplierCardNight]}>
                <TouchableOpacity 
                  style={styles.supplierHeader}
                  onPress={() => openDetailsModal(supplier)}
                >
                  <View style={styles.supplierAvatar}>
                    <Building size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.supplierInfo}>
                    <Text style={[styles.supplierName, nightMode && styles.supplierNameNight]}>
                      {supplier.name}
                    </Text>
                    <Text style={[styles.supplierCompany, nightMode && styles.supplierCompanyNight]}>
                      {supplier.company}
                    </Text>
                    
                    {(supplier.qualityRating || 0) > 0 && (
                      <View style={styles.ratingContainer}>
                        {renderStars(supplier.qualityRating || 0, 14)}
                      </View>
                    )}
                    
                    {supplier.phone && (
                      <View style={styles.supplierContact}>
                        <Phone size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                        <Text style={[styles.supplierPhone, nightMode && styles.supplierPhoneNight]}>
                          {supplier.phone}
                        </Text>
                      </View>
                    )}
                    
                    {supplier.products && supplier.products.length > 0 && (
                      <View style={styles.supplierContact}>
                        <Package size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                        <Text style={[styles.supplierProducts, nightMode && styles.supplierProductsNight]}>
                          {supplier.products.slice(0, 3).join(", ")}
                          {supplier.products.length > 3 ? `, +${supplier.products.length - 3} lainnya` : ""}
                        </Text>
                      </View>
                    )}
                    
                    {supplier.lastPurchase && (
                      <View style={styles.supplierContact}>
                        <Calendar size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                        <Text style={[styles.supplierLastPurchase, nightMode && styles.supplierLastPurchaseNight]}>
                          Terakhir: {formatDateTime(supplier.lastPurchase)}
                        </Text>
                      </View>
                    )}
                    
                    {supplier.totalPurchases > 0 && (
                      <View style={styles.supplierPurchases}>
                        <DollarSign size={14} color={colors.success} />
                        <Text style={styles.supplierPurchasesText}>
                          Total: {formatCurrency(supplier.totalPurchases)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.supplierActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.whatsappButton]}
                    onPress={() => handleSendWhatsApp(supplier)}
                    disabled={!supplier.phone}
                  >
                    <MessageCircle size={16} color={supplier.phone ? "#25D366" : colors.gray[400]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.orderButton]}
                    onPress={() => openOrderModal(supplier)}
                    disabled={!supplier.phone}
                  >
                    <ShoppingCart size={16} color={supplier.phone ? colors.secondary : colors.gray[400]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.ratingButton]}
                    onPress={() => openRatingModal(supplier)}
                  >
                    <Star size={16} color={colors.warning} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openModal(supplier)}
                  >
                    <Edit size={16} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(supplier)}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card variant="luxury" style={nightMode && styles.cardNight}>
            <View style={styles.emptyState}>
              <Truck size={64} color={nightMode ? colors.gray[600] : colors.textMuted} />
              <Text style={[styles.emptyTitle, nightMode && styles.emptyTitleNight]}>
                {searchQuery ? "Supplier Tidak Ditemukan" : "Belum Ada Supplier"}
              </Text>
              <Text style={[styles.emptyText, nightMode && styles.emptyTextNight]}>
                {searchQuery 
                  ? "Coba gunakan kata kunci yang berbeda"
                  : "Tambahkan supplier pertama Anda dengan menekan tombol + di atas"
                }
              </Text>
              {!searchQuery && (
                <Button
                  title="Tambah Supplier"
                  onPress={() => openModal()}
                  style={styles.emptyButton}
                  leftElement={<Plus size={16} color="#FFFFFF" />}
                />
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Add/Edit Supplier Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                {editingSupplier ? "Edit Supplier" : "Tambah Supplier"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Nama Kontak *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Masukkan nama kontak"
                leftElement={<User size={20} color={colors.primary} />}
              />

              <Input
                label="Nama Perusahaan *"
                value={formData.company}
                onChangeText={(text) => setFormData({ ...formData, company: text })}
                placeholder="Masukkan nama perusahaan"
                leftElement={<Building size={20} color={colors.primary} />}
              />

              <Input
                label="Nomor Telepon *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
                leftElement={<Phone size={20} color={colors.primary} />}
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Masukkan email (opsional)"
                keyboardType="email-address"
                leftElement={<Mail size={20} color={colors.primary} />}
              />

              <Input
                label="Alamat"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Masukkan alamat (opsional)"
                multiline
                numberOfLines={3}
                leftElement={<MapPin size={20} color={colors.primary} />}
              />

              <Input
                label="Produk yang Dipasok"
                value={formData.products}
                onChangeText={(text) => setFormData({ ...formData, products: text })}
                placeholder="Masukkan produk (pisahkan dengan koma)"
                multiline
                numberOfLines={2}
                leftElement={<Package size={20} color={colors.primary} />}
              />

              <Input
                label="Catatan"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Masukkan catatan (opsional)"
                multiline
                numberOfLines={3}
                leftElement={<FileText size={20} color={colors.primary} />}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Batal"
                  onPress={closeModal}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={editingSupplier ? "Perbarui" : "Simpan"}
                  onPress={handleSave}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Detail Supplier
              </Text>
              <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSupplier && (
                <>
                  <View style={styles.supplierDetailHeader}>
                    <View style={styles.supplierDetailAvatar}>
                      <Building size={32} color={colors.secondary} />
                    </View>
                    <View style={styles.supplierDetailInfo}>
                      <Text style={[styles.supplierDetailName, nightMode && styles.supplierDetailNameNight]}>
                        {selectedSupplier.name}
                      </Text>
                      <Text style={[styles.supplierDetailCompany, nightMode && styles.supplierDetailCompanyNight]}>
                        {selectedSupplier.company}
                      </Text>
                    </View>
                  </View>

                  {(selectedSupplier.qualityRating || 0) > 0 && (
                    <View style={styles.detailRatingContainer}>
                      <Text style={[styles.detailRatingLabel, nightMode && styles.detailRatingLabelNight]}>
                        Penilaian Kualitas:
                      </Text>
                      {renderStars(selectedSupplier.qualityRating || 0)}
                    </View>
                  )}

                  <View style={styles.supplierDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Informasi Kontak
                    </Text>
                    
                    <View style={styles.detailItem}>
                      <Phone size={16} color={colors.secondary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Telepon:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedSupplier.phone || "-"}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Mail size={16} color={colors.secondary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Email:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedSupplier.email || "-"}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <MapPin size={16} color={colors.secondary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Alamat:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedSupplier.address || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.supplierDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Produk yang Dipasok
                    </Text>
                    
                    {selectedSupplier.products && selectedSupplier.products.length > 0 ? (
                      <View style={styles.productsList}>
                        {selectedSupplier.products.map((product: string, index: number) => (
                          <View key={index} style={styles.productItem}>
                            <Package size={16} color={colors.secondary} />
                            <Text style={[styles.productName, nightMode && styles.productNameNight]}>
                              {product}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.emptyProducts, nightMode && styles.emptyProductsNight]}>
                        Belum ada produk yang tercatat
                      </Text>
                    )}
                  </View>

                  <View style={styles.supplierDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Statistik Supplier
                    </Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <ShoppingCart size={20} color={colors.secondary} />
                        <Text style={[styles.statItemValue, nightMode && styles.statItemValueNight]}>
                          {formatCurrency(selectedSupplier.totalPurchases)}
                        </Text>
                        <Text style={[styles.statItemLabel, nightMode && styles.statItemLabelNight]}>
                          Total Pembelian
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <DollarSign size={20} color={colors.error} />
                        <Text style={[styles.statItemValue, nightMode && styles.statItemValueNight]}>
                          {formatCurrency(selectedSupplier.totalDebt)}
                        </Text>
                        <Text style={[styles.statItemLabel, nightMode && styles.statItemLabelNight]}>
                          Total Hutang
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedSupplier.notes && (
                    <View style={styles.supplierDetailSection}>
                      <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                        Catatan
                      </Text>
                      <Text style={[styles.notesText, nightMode && styles.notesTextNight]}>
                        {selectedSupplier.notes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailActions}>
                    <Button
                      title="Edit Supplier"
                      onPress={() => {
                        closeDetailsModal();
                        openModal(selectedSupplier);
                      }}
                      leftElement={<Edit size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                    />
                    
                    <Button
                      title="Kirim WhatsApp"
                      onPress={() => handleSendWhatsApp(selectedSupplier)}
                      variant="secondary"
                      leftElement={<MessageCircle size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                      disabled={!selectedSupplier.phone}
                    />
                  </View>

                  <View style={styles.detailActions}>
                    <Button
                      title="Buat Pesanan"
                      onPress={() => {
                        closeDetailsModal();
                        openOrderModal(selectedSupplier);
                      }}
                      variant="success"
                      leftElement={<ShoppingCart size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                      disabled={!selectedSupplier.phone}
                    />
                    
                    <Button
                      title="Nilai Kualitas"
                      onPress={() => {
                        closeDetailsModal();
                        openRatingModal(selectedSupplier);
                      }}
                      variant="warning"
                      leftElement={<Star size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Modal */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Buat Pesanan
              </Text>
              <TouchableOpacity onPress={closeOrderModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSupplier && (
                <>
                  <Text style={[styles.orderSupplierName, nightMode && styles.orderSupplierNameNight]}>
                    {selectedSupplier.company}
                  </Text>
                  <Text style={[styles.orderSupplierContact, nightMode && styles.orderSupplierContactNight]}>
                    {selectedSupplier.name} • {selectedSupplier.phone}
                  </Text>
                  
                  <Text style={[styles.orderProductsTitle, nightMode && styles.orderProductsTitleNight]}>
                    Produk yang Dipesan
                  </Text>
                  
                  {orderProducts.map((product, index) => (
                    <View key={index} style={styles.orderProductRow}>
                      <View style={styles.orderProductNameContainer}>
                        <Input
                          label={`Produk ${index + 1}`}
                          value={product.name}
                          onChangeText={(text) => updateProductField(index, "name", text)}
                          placeholder="Nama produk"
                          containerStyle={styles.orderProductNameInput}
                        />
                      </View>
                      
                      <View style={styles.orderProductQuantityContainer}>
                        <Input
                          label="Jumlah"
                          value={product.quantity.toString()}
                          onChangeText={(text) => {
                            const quantity = parseInt(text) || 1;
                            updateProductField(index, "quantity", quantity);
                          }}
                          placeholder="Qty"
                          keyboardType="numeric"
                          containerStyle={styles.orderProductQuantityInput}
                        />
                      </View>
                      
                      <View style={styles.orderProductUnitContainer}>
                        <Input
                          label="Satuan"
                          value={product.unit}
                          onChangeText={(text) => updateProductField(index, "unit", text)}
                          placeholder="pcs"
                          containerStyle={styles.orderProductUnitInput}
                        />
                      </View>
                      
                      <TouchableOpacity
                        style={styles.removeProductButton}
                        onPress={() => removeProductField(index)}
                        disabled={orderProducts.length <= 1}
                      >
                        <X size={20} color={orderProducts.length <= 1 ? colors.gray[400] : colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={[styles.addProductButton, nightMode && styles.addProductButtonNight]}
                    onPress={addProductField}
                  >
                    <Plus size={16} color={colors.secondary} />
                    <Text style={styles.addProductButtonText}>Tambah Produk</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.orderPreview}>
                    <Text style={[styles.orderPreviewTitle, nightMode && styles.orderPreviewTitleNight]}>
                      Preview Pesan
                    </Text>
                    <Text style={[styles.orderPreviewText, nightMode && styles.orderPreviewTextNight]}>
                      {generateSupplierOrderMessage(
                        selectedSupplier.name,
                        storeInfo.name || "Toko Kami",
                        orderProducts.filter(p => p.name.trim() !== "")
                      )}
                    </Text>
                  </View>

                  <View style={styles.orderActions}>
                    <Button
                      title="Batal"
                      onPress={closeOrderModal}
                      variant="outline"
                      style={styles.orderActionButton}
                    />
                    <Button
                      title="Kirim Pesanan"
                      onPress={handleSendOrder}
                      style={styles.orderActionButton}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRatingModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Nilai Kualitas Supplier
              </Text>
              <TouchableOpacity onPress={closeRatingModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedSupplier && (
                <>
                  <Text style={[styles.ratingSupplierName, nightMode && styles.ratingSupplierNameNight]}>
                    {selectedSupplier.company}
                  </Text>
                  
                  <Text style={[styles.ratingInstructions, nightMode && styles.ratingInstructionsNight]}>
                    Berikan penilaian untuk kualitas produk dan layanan dari supplier ini
                  </Text>
                  
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setSelectedRating(star)}
                        style={styles.ratingStarButton}
                      >
                        <Star
                          size={40}
                          fill={star <= selectedRating ? colors.warning : "none"}
                          color={star <= selectedRating ? colors.warning : colors.gray[400]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <Text style={[styles.ratingValue, nightMode && styles.ratingValueNight]}>
                    {selectedRating === 0 ? "Belum dinilai" :
                     selectedRating === 1 ? "Sangat Buruk" :
                     selectedRating === 2 ? "Buruk" :
                     selectedRating === 3 ? "Cukup" :
                     selectedRating === 4 ? "Baik" :
                     "Sangat Baik"}
                  </Text>

                  <View style={styles.ratingActions}>
                    <Button
                      title="Batal"
                      onPress={closeRatingModal}
                      variant="outline"
                      style={styles.ratingActionButton}
                    />
                    <Button
                      title="Simpan Penilaian"
                      onPress={handleSaveRating}
                      style={styles.ratingActionButton}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Urutan
              </Text>
              <TouchableOpacity onPress={closeFilterModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>
                Urutan Supplier
              </Text>
              
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'recent' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('recent')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'recent' && styles.sortOptionTextSelected
                  ]}>
                    Terbaru
                  </Text>
                  {sortOption === 'recent' && <ChevronDown size={16} color={colors.secondary} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'name' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('name')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'name' && styles.sortOptionTextSelected
                  ]}>
                    Nama (A-Z)
                  </Text>
                  {sortOption === 'name' && <ChevronDown size={16} color={colors.secondary} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'company' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('company')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'company' && styles.sortOptionTextSelected
                  ]}>
                    Perusahaan (A-Z)
                  </Text>
                  {sortOption === 'company' && <ChevronDown size={16} color={colors.secondary} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'purchases' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('purchases')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'purchases' && styles.sortOptionTextSelected
                  ]}>
                    Total Pembelian
                  </Text>
                  {sortOption === 'purchases' && <ChevronDown size={16} color={colors.secondary} />}
                </TouchableOpacity>
              </View>

              <Button
                title="Terapkan"
                onPress={closeFilterModal}
                style={{ marginTop: 20 }}
              />
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
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainerNight: {
    backgroundColor: colors.gray[900],
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12,
  },
  searchBarNight: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[700],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  searchInputNight: {
    color: colors.gray[100],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
  },
  filterButtonNight: {
    backgroundColor: `${colors.secondary}25`,
    borderColor: `${colors.secondary}40`,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewNight: {
    backgroundColor: colors.gray[900],
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  cardNight: {
    backgroundColor: colors.gray[800],
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 12,
  },
  statsTitleNight: {
    color: colors.gray[100],
  },
  statsValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 16,
  },
  statsValueNight: {
    color: colors.secondary,
  },
  statsDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statDetail: {
    flex: 1,
    alignItems: "center",
  },
  statDetailValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statDetailValueNight: {
    color: colors.gray[100],
  },
  statDetailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  statDetailLabelNight: {
    color: colors.gray[400],
  },
  suppliersList: {
    marginTop: 20,
    gap: 16,
  },
  supplierCard: {
    padding: 0,
  },
  supplierCardNight: {
    backgroundColor: colors.gray[800],
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  supplierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  supplierNameNight: {
    color: colors.gray[100],
  },
  supplierCompany: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.secondary,
    marginBottom: 8,
  },
  supplierCompanyNight: {
    color: colors.secondary,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
  },
  supplierContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  supplierPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  supplierPhoneNight: {
    color: colors.gray[300],
  },
  supplierProducts: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  supplierProductsNight: {
    color: colors.gray[300],
  },
  supplierLastPurchase: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  supplierLastPurchaseNight: {
    color: colors.gray[300],
  },
  supplierPurchases: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  supplierPurchasesText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
    marginLeft: 8,
  },
  supplierActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappButton: {
    backgroundColor: "#25D36615",
  },
  orderButton: {
    backgroundColor: `${colors.secondary}15`,
  },
  ratingButton: {
    backgroundColor: `${colors.warning}15`,
  },
  editButton: {
    backgroundColor: `${colors.primary}15`,
  },
  deleteButton: {
    backgroundColor: `${colors.error}15`,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleNight: {
    color: colors.gray[100],
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyTextNight: {
    color: colors.gray[400],
  },
  emptyButton: {
    marginTop: 16,
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
    maxHeight: "90%",
  },
  modalContentNight: {
    backgroundColor: colors.gray[800],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderNight: {
    borderBottomColor: colors.gray[700],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  modalTitleNight: {
    color: colors.gray[100],
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  supplierDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  supplierDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  supplierDetailInfo: {
    flex: 1,
  },
  supplierDetailName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  supplierDetailNameNight: {
    color: colors.gray[100],
  },
  supplierDetailCompany: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.secondary,
  },
  supplierDetailCompanyNight: {
    color: colors.secondary,
  },
  detailRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  detailRatingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginRight: 12,
  },
  detailRatingLabelNight: {
    color: colors.gray[100],
  },
  supplierDetailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitleNight: {
    color: colors.gray[100],
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    width: 80,
    marginLeft: 8,
  },
  detailLabelNight: {
    color: colors.gray[300],
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  detailValueNight: {
    color: colors.gray[100],
  },
  productsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  productName: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
  },
  productNameNight: {
    color: colors.secondary,
  },
  emptyProducts: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  emptyProductsNight: {
    color: colors.gray[400],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statItemValueNight: {
    color: colors.gray[100],
  },
  statItemLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  statItemLabelNight: {
    color: colors.gray[400],
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  notesTextNight: {
    color: colors.gray[300],
    backgroundColor: colors.gray[700],
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  detailActionButton: {
    flex: 1,
  },
  orderSupplierName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  orderSupplierNameNight: {
    color: colors.gray[100],
  },
  orderSupplierContact: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  orderSupplierContactNight: {
    color: colors.gray[300],
  },
  orderProductsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  orderProductsTitleNight: {
    color: colors.gray[100],
  },
  orderProductRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  orderProductNameContainer: {
    flex: 3,
    marginRight: 8,
  },
  orderProductNameInput: {
    marginBottom: 0,
  },
  orderProductQuantityContainer: {
    flex: 1,
    marginRight: 8,
  },
  orderProductQuantityInput: {
    marginBottom: 0,
  },
  orderProductUnitContainer: {
    flex: 1,
    marginRight: 8,
  },
  orderProductUnitInput: {
    marginBottom: 0,
  },
  removeProductButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.error}15`,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
    borderStyle: "dashed",
    borderRadius: 12,
    marginBottom: 24,
  },
  addProductButtonNight: {
    borderColor: `${colors.secondary}50`,
  },
  addProductButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.secondary,
    marginLeft: 8,
  },
  orderPreview: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  orderPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  orderPreviewTitleNight: {
    color: colors.gray[100],
  },
  orderPreviewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  orderPreviewTextNight: {
    color: colors.gray[300],
  },
  orderActions: {
    flexDirection: "row",
    gap: 12,
  },
  orderActionButton: {
    flex: 1,
  },
  ratingSupplierName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  ratingSupplierNameNight: {
    color: colors.gray[100],
  },
  ratingInstructions: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  ratingInstructionsNight: {
    color: colors.gray[300],
  },
  ratingStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  ratingStarButton: {
    padding: 8,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.warning,
    textAlign: "center",
    marginBottom: 32,
  },
  ratingValueNight: {
    color: colors.warning,
  },
  ratingActions: {
    flexDirection: "row",
    gap: 12,
  },
  ratingActionButton: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  filterSectionTitleNight: {
    color: colors.gray[100],
  },
  sortOptions: {
    gap: 12,
    marginBottom: 24,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sortOptionSelected: {
    backgroundColor: `${colors.secondary}15`,
    borderColor: colors.secondary,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: colors.secondary,
    fontWeight: "600",
  },
});