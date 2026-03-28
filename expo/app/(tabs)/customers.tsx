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
import { useCustomerStore } from "@/store/useCustomerStore";
import { useDebtStore } from "@/store/useDebtStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/dateUtils";
import { generateWhatsAppLink } from "@/utils/whatsappUtils";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2,
  X,
  User,
  Mail,
  CreditCard,
  ShoppingBag,
  Star,
  MessageCircle,
  Calendar,
  Clock,
  AlertCircle,
  Award,
  Crown,
  Gift,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react-native";
import { Customer, Transaction, CartItem } from "@/types";

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [transactionsModalVisible, setTransactionsModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [filterOption, setFilterOption] = useState("all"); // all, inactive, withDebt, highValue
  const [sortOption, setSortOption] = useState("recent"); // recent, name, spent

  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);
  const getInactiveCustomers = useCustomerStore((state) => state.getInactiveCustomers);
  
  const debts = useDebtStore((state) => state.debts);
  const getCustomerDebts = useDebtStore((state) => state.getCustomerDebts);
  
  const transactions = useTransactionStore((state) => state.transactions);
  // Custom function to get customer transactions since it's not in the store
  const getCustomerTransactions = (customerId: string): Transaction[] => {
    return transactions.filter(t => t.customerId === customerId);
  };
  
  const nightMode = useSettingsStore((state) => state.nightMode);
  const storeInfo = useSettingsStore((state) => state.storeInfo);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    status: "active" as "active" | "inactive" | "blacklisted", // Fixed type
  });

  // Apply filters and sorting
  const getFilteredCustomers = () => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    switch (filterOption) {
      case "inactive":
        filtered = getInactiveCustomers(30); // Inactive for 30 days
        break;
      case "withDebt":
        const customerIdsWithDebt = debts
          .filter(debt => debt.status === 'unpaid')
          .map(debt => debt.customerId);
        filtered = filtered.filter(customer => customerIdsWithDebt.includes(customer.id));
        break;
      case "highValue":
        filtered = filtered.filter(customer => customer.totalSpent >= 1000000); // 1 juta+
        break;
      case "blacklisted":
        filtered = filtered.filter(customer => customer.status === 'blacklisted');
        break;
    }
    
    // Apply sorting
    switch (sortOption) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "spent":
        filtered.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => {
          const aVisit = a.lastVisit || a.createdAt;
          const bVisit = b.lastVisit || b.createdAt;
          return bVisit - aVisit;
        });
        break;
    }
    
    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        notes: customer.notes || "",
        status: customer.status || "active",
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        status: "active",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
    });
  };

  const openDetailsModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedCustomer(null);
  };

  const openTransactionsModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTransactionsModalVisible(true);
  };

  const closeTransactionsModal = () => {
    setTransactionsModalVisible(false);
    setSelectedCustomer(null);
  };

  const openNotesModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setNotesModalVisible(true);
  };

  const closeNotesModal = () => {
    setNotesModalVisible(false);
    setSelectedCustomer(null);
    setCustomerNotes("");
  };

  const openFilterModal = () => {
    setFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setFilterModalVisible(false);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert("Error", "Nama dan nomor telepon harus diisi");
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
        status: formData.status,
      });
      Alert.alert("Sukses", "Data pelanggan berhasil diperbarui");
    } else {
      addCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
      });
      Alert.alert("Sukses", "Pelanggan baru berhasil ditambahkan");
    }
    closeModal();
  };

  const handleSaveNotes = () => {
    if (!selectedCustomer) return;
    
    updateCustomer(selectedCustomer.id, { notes: customerNotes });
    Alert.alert("Sukses", "Catatan pelanggan berhasil disimpan");
    closeNotesModal();
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteCustomer(customer.id);
            Alert.alert("Sukses", "Pelanggan berhasil dihapus");
          },
        },
      ]
    );
  };

  const handleStatusChange = (customer: Customer, newStatus: 'active' | 'inactive' | 'blacklisted') => {
    updateCustomer(customer.id, { status: newStatus });
    Alert.alert("Sukses", `Status pelanggan diubah menjadi ${newStatus}`);
    
    if (selectedCustomer && selectedCustomer.id === customer.id) {
      setSelectedCustomer({...selectedCustomer, status: newStatus});
    }
  };

  const handleSendWhatsApp = (customer: Customer) => {
    if (!customer.phone) {
      Alert.alert("Error", "Pelanggan tidak memiliki nomor telepon");
      return;
    }

    const message = `Halo ${customer.name}, ini dari ${storeInfo.name || "Toko Kami"}. Terima kasih telah menjadi pelanggan kami.`;
    const whatsappLink = generateWhatsAppLink(customer.phone, message);
    
    Linking.openURL(whatsappLink).catch(err => {
      Alert.alert("Error", "Tidak dapat membuka WhatsApp");
    });
  };

  const getCustomerDebtsTotal = (customerId: string) => {
    const customerDebts = getCustomerDebts(customerId);
    return customerDebts
      .filter(debt => debt.status === 'unpaid')
      .reduce((total, debt) => total + debt.remainingDebt, 0);
  };

  const getLastTransactionDate = (customerId: string) => {
    const customerTransactions = getCustomerTransactions(customerId);
    if (customerTransactions.length === 0) return null;
    
    return Math.max(...customerTransactions.map(t => t.createdAt));
  };

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'platinum': return <Crown size={16} color="#E5E7EB" />;
      case 'gold': return <Award size={16} color="#F59E0B" />;
      case 'silver': return <Star size={16} color="#6B7280" />;
      default: return <Gift size={16} color="#8B5CF6" />;
    }
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'platinum': return '#E5E7EB';
      case 'gold': return '#F59E0B';
      case 'silver': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'inactive':
        return styles.statusInactive;
      case 'blacklisted':
        return styles.statusBlacklisted;
      default:
        return styles.statusActive;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.statusTextActive;
      case 'inactive':
        return styles.statusTextInactive;
      case 'blacklisted':
        return styles.statusTextBlacklisted;
      default:
        return styles.statusTextActive;
    }
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: "👥 Pelanggan",
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
            placeholder="Cari pelanggan..."
            placeholderTextColor={nightMode ? colors.gray[400] : colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, nightMode && styles.filterButtonNight]}
          onPress={openFilterModal}
        >
          <Filter size={20} color={colors.primary} />
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
            <Users size={24} color={colors.primary} />
            <Text style={[styles.statsTitle, nightMode && styles.statsTitleNight]}>
              Total Pelanggan
            </Text>
          </View>
          <Text style={[styles.statsValue, nightMode && styles.statsValueNight]}>
            {customers.length}
          </Text>
          <View style={styles.statsDetails}>
            <View style={styles.statDetail}>
              <Text style={[styles.statDetailValue, nightMode && styles.statDetailValueNight]}>
                {customers.filter(c => c.status === 'active').length}
              </Text>
              <Text style={[styles.statDetailLabel, nightMode && styles.statDetailLabelNight]}>
                Aktif
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={[styles.statDetailValue, nightMode && styles.statDetailValueNight]}>
                {customers.filter(c => c.status === 'inactive').length}
              </Text>
              <Text style={[styles.statDetailLabel, nightMode && styles.statDetailLabelNight]}>
                Tidak Aktif
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={[styles.statDetailValue, nightMode && styles.statDetailValueNight]}>
                {customers.filter(c => c.status === 'blacklisted').length}
              </Text>
              <Text style={[styles.statDetailLabel, nightMode && styles.statDetailLabelNight]}>
                Blacklist
              </Text>
            </View>
          </View>
        </Card>

        {/* Filter Info */}
        {filterOption !== "all" && (
          <View style={styles.filterInfo}>
            <Text style={[styles.filterInfoText, nightMode && styles.filterInfoTextNight]}>
              Filter: {
                filterOption === "inactive" ? "Pelanggan Tidak Aktif" :
                filterOption === "withDebt" ? "Pelanggan dengan Hutang" :
                filterOption === "highValue" ? "Pelanggan Bernilai Tinggi" :
                filterOption === "blacklisted" ? "Pelanggan Blacklist" : ""
              }
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => setFilterOption("all")}
            >
              <X size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Customers List */}
        {filteredCustomers.length > 0 ? (
          <View style={styles.customersList}>
            {filteredCustomers.map((customer) => {
              const customerDebtsTotal = getCustomerDebtsTotal(customer.id);
              const lastTransactionDate = getLastTransactionDate(customer.id);
              
              return (
                <Card key={customer.id} style={[styles.customerCard, nightMode && styles.customerCardNight]}>
                  <TouchableOpacity 
                    style={styles.customerHeader}
                    onPress={() => openDetailsModal(customer)}
                  >
                    <View style={[
                      styles.customerAvatar,
                      customer.status === 'blacklisted' && styles.customerAvatarBlacklisted
                    ]}>
                      <User size={24} color={customer.status === 'blacklisted' ? colors.error : colors.primary} />
                    </View>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerNameRow}>
                        <Text style={[styles.customerName, nightMode && styles.customerNameNight]}>
                          {customer.name}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          getStatusBadgeStyle(customer.status)
                        ]}>
                          <Text style={[
                            styles.statusText,
                            getStatusTextStyle(customer.status)
                          ]}>
                            {customer.status === 'active' ? 'Aktif' : 
                             customer.status === 'inactive' ? 'Tidak Aktif' : 
                             'Blacklist'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.membershipRow}>
                        <View style={[
                          styles.membershipBadge,
                          { backgroundColor: `${getMembershipColor(customer.membershipLevel)}20` }
                        ]}>
                          {getMembershipIcon(customer.membershipLevel)}
                          <Text style={[
                            styles.membershipText,
                            { color: getMembershipColor(customer.membershipLevel) }
                          ]}>
                            {customer.membershipLevel.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.pointsText, nightMode && styles.pointsTextNight]}>
                          {customer.loyaltyPoints} poin
                        </Text>
                      </View>
                      
                      {customer.phone && (
                        <View style={styles.customerContact}>
                          <Phone size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                          <Text style={[styles.customerPhone, nightMode && styles.customerPhoneNight]}>
                            {customer.phone}
                          </Text>
                        </View>
                      )}
                      
                      {lastTransactionDate && (
                        <View style={styles.customerContact}>
                          <Clock size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                          <Text style={[styles.customerLastVisit, nightMode && styles.customerLastVisitNight]}>
                            Terakhir: {formatDateTime(lastTransactionDate)}
                          </Text>
                        </View>
                      )}
                      
                      {customerDebtsTotal > 0 && (
                        <View style={styles.customerDebt}>
                          <CreditCard size={14} color={colors.error} />
                          <Text style={styles.customerDebtText}>
                            Hutang: {formatCurrency(customerDebtsTotal)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.customerActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.whatsappButton]}
                      onPress={() => handleSendWhatsApp(customer)}
                      disabled={!customer.phone}
                    >
                      <MessageCircle size={16} color={customer.phone ? "#25D366" : colors.gray[400]} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.transactionsButton]}
                      onPress={() => openTransactionsModal(customer)}
                    >
                      <ShoppingBag size={16} color={colors.secondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.notesButton]}
                      onPress={() => openNotesModal(customer)}
                    >
                      <FileText size={16} color={colors.info} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openModal(customer)}
                    >
                      <Edit size={16} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(customer)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card variant="luxury" style={nightMode && styles.cardNight}>
            <View style={styles.emptyState}>
              <Users size={64} color={nightMode ? colors.gray[600] : colors.textMuted} />
              <Text style={[styles.emptyTitle, nightMode && styles.emptyTitleNight]}>
                {searchQuery || filterOption !== "all" ? "Pelanggan Tidak Ditemukan" : "Belum Ada Pelanggan"}
              </Text>
              <Text style={[styles.emptyText, nightMode && styles.emptyTextNight]}>
                {searchQuery || filterOption !== "all" 
                  ? "Coba gunakan kata kunci atau filter yang berbeda"
                  : "Tambahkan pelanggan pertama Anda dengan menekan tombol + di atas"
                }
              </Text>
              {!searchQuery && filterOption === "all" && (
                <Button
                  title="Tambah Pelanggan"
                  onPress={() => openModal()}
                  style={styles.emptyButton}
                  leftElement={<Plus size={16} color="#FFFFFF" />}
                />
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Add/Edit Customer Modal */}
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
                {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Nama Lengkap *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Masukkan nama lengkap"
                leftElement={<User size={20} color={colors.primary} />}
              />

              <Input
                label="Nomor Telepon (+628XXXX) *"
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
                label="Catatan"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Masukkan catatan (opsional)"
                multiline
                numberOfLines={3}
                leftElement={<FileText size={20} color={colors.primary} />}
              />

              {editingCustomer && (
                <View style={styles.statusSelector}>
                  <Text style={[styles.statusLabel, nightMode && styles.statusLabelNight]}>
                    Status Pelanggan
                  </Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        formData.status === 'active' && styles.statusOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, status: 'active' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === 'active' && styles.statusOptionTextSelected
                      ]}>
                        Aktif
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        formData.status === 'inactive' && styles.statusOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, status: 'inactive' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === 'inactive' && styles.statusOptionTextSelected
                      ]}>
                        Tidak Aktif
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        formData.status === 'blacklisted' && styles.statusOptionSelected,
                        styles.blacklistOption
                      ]}
                      onPress={() => setFormData({ ...formData, status: 'blacklisted' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === 'blacklisted' && styles.statusOptionTextSelected
                      ]}>
                        Blacklist
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Batal"
                  onPress={closeModal}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={editingCustomer ? "Perbarui" : "Simpan"}
                  onPress={handleSave}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customer Details Modal */}
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
                Detail Pelanggan
              </Text>
              <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedCustomer && (
                <>
                  <View style={styles.customerDetailHeader}>
                    <View style={[
                      styles.customerDetailAvatar,
                      selectedCustomer.status === 'blacklisted' && styles.customerAvatarBlacklisted
                    ]}>
                      <User size={32} color={selectedCustomer.status === 'blacklisted' ? colors.error : colors.primary} />
                    </View>
                    <View style={styles.customerDetailInfo}>
                      <Text style={[styles.customerDetailName, nightMode && styles.customerDetailNameNight]}>
                        {selectedCustomer.name}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        getStatusBadgeStyle(selectedCustomer.status)
                      ]}>
                        <Text style={[
                          styles.statusText,
                          getStatusTextStyle(selectedCustomer.status)
                        ]}>
                          {selectedCustomer.status === 'active' ? 'Aktif' : 
                           selectedCustomer.status === 'inactive' ? 'Tidak Aktif' : 
                           'Blacklist'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.customerDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Informasi Kontak
                    </Text>
                    
                    <View style={styles.detailItem}>
                      <Phone size={16} color={colors.primary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Telepon:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedCustomer.phone || "-"}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Mail size={16} color={colors.primary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Email:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedCustomer.email || "-"}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <MapPin size={16} color={colors.primary} />
                      <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                        Alamat:
                      </Text>
                      <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                        {selectedCustomer.address || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.customerDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Informasi Membership
                    </Text>
                    
                    <View style={styles.membershipDetail}>
                      <View style={[
                        styles.membershipBadgeLarge,
                        { backgroundColor: `${getMembershipColor(selectedCustomer.membershipLevel)}20` }
                      ]}>
                        {getMembershipIcon(selectedCustomer.membershipLevel)}
                        <Text style={[
                          styles.membershipTextLarge,
                          { color: getMembershipColor(selectedCustomer.membershipLevel) }
                        ]}>
                          {selectedCustomer.membershipLevel.toUpperCase()}
                        </Text>
                      </View>
                      
                      <View style={styles.membershipInfo}>
                        <View style={styles.membershipInfoItem}>
                          <Text style={[styles.membershipInfoLabel, nightMode && styles.membershipInfoLabelNight]}>
                            Poin Loyalitas:
                          </Text>
                          <Text style={[styles.membershipInfoValue, nightMode && styles.membershipInfoValueNight]}>
                            {selectedCustomer.loyaltyPoints} poin
                          </Text>
                        </View>
                        
                        <View style={styles.membershipInfoItem}>
                          <Text style={[styles.membershipInfoLabel, nightMode && styles.membershipInfoLabelNight]}>
                            Diskon Member:
                          </Text>
                          <Text style={[styles.membershipInfoValue, nightMode && styles.membershipInfoValueNight]}>
                            {selectedCustomer.discountPercentage}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.customerDetailSection}>
                    <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                      Statistik Pelanggan
                    </Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <ShoppingBag size={20} color={colors.primary} />
                        <Text style={[styles.statItemValue, nightMode && styles.statItemValueNight]}>
                          {formatCurrency(selectedCustomer.totalSpent)}
                        </Text>
                        <Text style={[styles.statItemLabel, nightMode && styles.statItemLabelNight]}>
                          Total Belanja
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Calendar size={20} color={colors.secondary} />
                        <Text style={[styles.statItemValue, nightMode && styles.statItemValueNight]}>
                          {selectedCustomer.visitCount}
                        </Text>
                        <Text style={[styles.statItemLabel, nightMode && styles.statItemLabelNight]}>
                          Jumlah Kunjungan
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <CreditCard size={20} color={colors.error} />
                        <Text style={[styles.statItemValue, nightMode && styles.statItemValueNight]}>
                          {formatCurrency(getCustomerDebtsTotal(selectedCustomer.id))}
                        </Text>
                        <Text style={[styles.statItemLabel, nightMode && styles.statItemLabelNight]}>
                          Total Hutang
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedCustomer.notes && (
                    <View style={styles.customerDetailSection}>
                      <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>
                        Catatan
                      </Text>
                      <Text style={[styles.notesText, nightMode && styles.notesTextNight]}>
                        {selectedCustomer.notes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailActions}>
                    <Button
                      title="Edit Pelanggan"
                      onPress={() => {
                        closeDetailsModal();
                        openModal(selectedCustomer);
                      }}
                      leftElement={<Edit size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                    />
                    
                    <Button
                      title="Kirim WhatsApp"
                      onPress={() => handleSendWhatsApp(selectedCustomer)}
                      variant="secondary"
                      leftElement={<MessageCircle size={16} color="#FFFFFF" />}
                      style={styles.detailActionButton}
                      disabled={!selectedCustomer.phone}
                    />
                  </View>

                  <View style={styles.statusActions}>
                    {selectedCustomer.status !== 'active' && (
                      <Button
                        title="Tandai Aktif"
                        onPress={() => handleStatusChange(selectedCustomer, 'active')}
                        variant="success"
                        style={styles.statusActionButton}
                      />
                    )}
                    
                    {selectedCustomer.status !== 'inactive' && (
                      <Button
                        title="Tandai Tidak Aktif"
                        onPress={() => handleStatusChange(selectedCustomer, 'inactive')}
                        variant="danger"
                        style={styles.statusActionButton}
                      />
                    )}
                    
                    {selectedCustomer.status !== 'blacklisted' && (
                      <Button
                        title="Tambahkan ke Blacklist"
                        onPress={() => handleStatusChange(selectedCustomer, 'blacklisted')}
                        variant="danger"
                        style={styles.statusActionButton}
                      />
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transactions History Modal */}
      <Modal
        visible={transactionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTransactionsModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Riwayat Transaksi
              </Text>
              <TouchableOpacity onPress={closeTransactionsModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedCustomer && (
                <>
                  <View style={styles.transactionCustomerInfo}>
                    <Text style={[styles.transactionCustomerName, nightMode && styles.transactionCustomerNameNight]}>
                      {selectedCustomer.name}
                    </Text>
                    <Text style={[styles.transactionCustomerTotal, nightMode && styles.transactionCustomerTotalNight]}>
                      Total Belanja: {formatCurrency(selectedCustomer.totalSpent)}
                    </Text>
                  </View>

                  {(() => {
                    const customerTransactions = getCustomerTransactions(selectedCustomer.id);
                    
                    if (customerTransactions.length === 0) {
                      return (
                        <View style={styles.emptyTransactions}>
                          <ShoppingBag size={48} color={nightMode ? colors.gray[600] : colors.textMuted} />
                          <Text style={[styles.emptyTransactionsText, nightMode && styles.emptyTransactionsTextNight]}>
                            Belum ada transaksi
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <FlatList
                        data={customerTransactions.sort((a, b) => b.createdAt - a.createdAt)}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <View style={[styles.transactionItem, nightMode && styles.transactionItemNight]}>
                            <View style={styles.transactionHeader}>
                              <Text style={[styles.transactionId, nightMode && styles.transactionIdNight]}>
                                #{item.id.slice(-6)}
                              </Text>
                              <Text style={[styles.transactionDate, nightMode && styles.transactionDateNight]}>
                                {formatDateTime(item.createdAt)}
                              </Text>
                            </View>
                            
                            <Text style={[styles.transactionTotal, nightMode && styles.transactionTotalNight]}>
                              {formatCurrency(item.total)}
                            </Text>
                            
                            <Text style={[styles.transactionItemsCount, nightMode && styles.transactionItemsCountNight]}>
                              {item.items.length} item
                            </Text>
                            
                            <View style={styles.transactionItems}>
                              {item.items.slice(0, 3).map((cartItem: CartItem, index: number) => (
                                <Text key={index} style={[styles.transactionItemName, nightMode && styles.transactionItemNameNight]}>
                                  • {cartItem.name} ({cartItem.quantity}x)
                                </Text>
                              ))}
                              {item.items.length > 3 && (
                                <Text style={[styles.transactionItemMore, nightMode && styles.transactionItemMoreNight]}>
                                  ... dan {item.items.length - 3} item lainnya
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                        style={styles.transactionsList}
                        contentContainerStyle={styles.transactionsListContent}
                      />
                    );
                  })()}

                  <Button
                    title="Tutup"
                    onPress={closeTransactionsModal}
                    style={{ marginTop: 20 }}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNotesModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Catatan Pelanggan
              </Text>
              <TouchableOpacity onPress={closeNotesModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedCustomer && (
                <>
                  <Text style={[styles.notesCustomerName, nightMode && styles.notesCustomerNameNight]}>
                    {selectedCustomer.name}
                  </Text>
                  
                  <Text style={[styles.notesLabel, nightMode && styles.notesLabelNight]}>
                    Catatan Pelanggan
                  </Text>
                  
                  <TextInput
                    style={[styles.notesInput, nightMode && styles.notesInputNight]}
                    value={customerNotes}
                    onChangeText={setCustomerNotes}
                    placeholder="Masukkan catatan tentang pelanggan ini..."
                    placeholderTextColor={nightMode ? colors.gray[500] : colors.gray[400]}
                    multiline
                    numberOfLines={6}
                  />
                  
                  <Text style={[styles.notesHelper, nightMode && styles.notesHelperNight]}>
                    Catatan ini hanya dapat dilihat oleh Anda dan tidak akan ditampilkan kepada pelanggan.
                  </Text>

                  <View style={styles.notesActions}>
                    <Button
                      title="Batal"
                      onPress={closeNotesModal}
                      variant="outline"
                      style={styles.notesActionButton}
                    />
                    <Button
                      title="Simpan"
                      onPress={handleSaveNotes}
                      style={styles.notesActionButton}
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
                Filter & Urutan
              </Text>
              <TouchableOpacity onPress={closeFilterModal} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>
                Filter Pelanggan
              </Text>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterOption === 'all' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterOption('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOption === 'all' && styles.filterOptionTextSelected
                  ]}>
                    Semua Pelanggan
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterOption === 'inactive' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterOption('inactive')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOption === 'inactive' && styles.filterOptionTextSelected
                  ]}>
                    Tidak Aktif (30+ hari)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterOption === 'withDebt' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterOption('withDebt')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOption === 'withDebt' && styles.filterOptionTextSelected
                  ]}>
                    Memiliki Hutang
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterOption === 'highValue' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterOption('highValue')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOption === 'highValue' && styles.filterOptionTextSelected
                  ]}>
                    Bernilai Tinggi (1jt+)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterOption === 'blacklisted' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterOption('blacklisted')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOption === 'blacklisted' && styles.filterOptionTextSelected
                  ]}>
                    Blacklist
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>
                Urutan
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
                  {sortOption === 'recent' && <ChevronDown size={16} color={colors.primary} />}
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
                  {sortOption === 'name' && <ChevronDown size={16} color={colors.primary} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'spent' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('spent')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'spent' && styles.sortOptionTextSelected
                  ]}>
                    Total Belanja
                  </Text>
                  {sortOption === 'spent' && <ChevronDown size={16} color={colors.primary} />}
                </TouchableOpacity>
              </View>

              <Button
                title="Terapkan Filter"
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
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  filterButtonNight: {
    backgroundColor: `${colors.primary}25`,
    borderColor: `${colors.primary}40`,
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
    color: colors.primary,
    marginBottom: 16,
  },
  statsValueNight: {
    color: colors.primary,
  },
  statsDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statDetail: {
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
  filterInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterInfoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  filterInfoTextNight: {
    color: colors.primary,
  },
  clearFilterButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}25`,
    justifyContent: "center",
    alignItems: "center",
  },
  customersList: {
    marginTop: 20,
    gap: 16,
  },
  customerCard: {
    padding: 0,
  },
  customerCardNight: {
    backgroundColor: colors.gray[800],
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerAvatarBlacklisted: {
    backgroundColor: `${colors.error}15`,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  customerNameNight: {
    color: colors.gray[100],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: `${colors.success}20`,
  },
  statusInactive: {
    backgroundColor: `${colors.warning}20`,
  },
  statusBlacklisted: {
    backgroundColor: `${colors.error}20`,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.warning,
  },
  statusTextBlacklisted: {
    color: colors.error,
  },
  membershipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  membershipText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },
  pointsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pointsTextNight: {
    color: colors.gray[400],
  },
  customerContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  customerPhoneNight: {
    color: colors.gray[300],
  },
  customerLastVisit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  customerLastVisitNight: {
    color: colors.gray[300],
  },
  customerDebt: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  customerDebtText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
    marginLeft: 8,
  },
  customerActions: {
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
  transactionsButton: {
    backgroundColor: `${colors.secondary}15`,
  },
  notesButton: {
    backgroundColor: `${colors.info}15`,
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
  statusSelector: {
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 12,
  },
  statusLabelNight: {
    color: colors.gray[100],
  },
  statusOptions: {
    flexDirection: "row",
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  statusOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  blacklistOption: {
    borderColor: `${colors.error}50`,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  customerDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  customerDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerDetailInfo: {
    flex: 1,
  },
  customerDetailName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  customerDetailNameNight: {
    color: colors.gray[100],
  },
  customerDetailSection: {
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
  membershipDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  membershipBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 16,
  },
  membershipTextLarge: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipInfoItem: {
    marginBottom: 8,
  },
  membershipInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  membershipInfoLabelNight: {
    color: colors.gray[300],
  },
  membershipInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  membershipInfoValueNight: {
    color: colors.gray[100],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  statusActions: {
    gap: 12,
    marginTop: 8,
  },
  statusActionButton: {
    width: "100%",
  },
  transactionCustomerInfo: {
    marginBottom: 20,
  },
  transactionCustomerName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  transactionCustomerNameNight: {
    color: colors.gray[100],
  },
  transactionCustomerTotal: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.success,
  },
  transactionCustomerTotalNight: {
    color: colors.success,
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
  emptyTransactionsTextNight: {
    color: colors.gray[400],
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionsListContent: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  transactionItemNight: {
    backgroundColor: colors.gray[700],
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  transactionIdNight: {
    color: colors.gray[100],
  },
  transactionDate: {
    fontSize: 14,
    color: colors.textMuted,
  },
  transactionDateNight: {
    color: colors.gray[400],
  },
  transactionTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 8,
  },
  transactionTotalNight: {
    color: colors.success,
  },
  transactionItemsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  transactionItemsCountNight: {
    color: colors.gray[300],
  },
  transactionItems: {
    marginTop: 4,
  },
  transactionItemName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionItemNameNight: {
    color: colors.gray[300],
  },
  transactionItemMore: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  transactionItemMoreNight: {
    color: colors.gray[400],
  },
  notesCustomerName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 20,
  },
  notesCustomerNameNight: {
    color: colors.gray[100],
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 12,
  },
  notesLabelNight: {
    color: colors.gray[100],
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  notesInputNight: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
    color: colors.gray[100],
  },
  notesHelper: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  notesHelperNight: {
    color: colors.gray[400],
  },
  notesActions: {
    flexDirection: "row",
    gap: 12,
  },
  notesActionButton: {
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
  filterOptions: {
    gap: 12,
    marginBottom: 24,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  sortOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  sortOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sortOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});