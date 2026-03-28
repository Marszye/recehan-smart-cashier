import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useCustomerStore } from '@/store/useCustomerStore';
import { Customer } from '@/types';
import { Plus, Search, X, Star, Crown, Award, Gift, User, Phone } from 'lucide-react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

interface CustomerSelectorProps {
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const getCustomer = useCustomerStore((state) => state.getCustomer);
  
  const nightMode = useSettingsStore((state) => state.nightMode);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = getCustomer(selectedCustomerId);
      if (customer) {
        setSelectedCustomerName(customer.name);
      }
    } else {
      setSelectedCustomerName('');
    }
  }, [selectedCustomerId, getCustomer]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) {
      return;
    }

    addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      email: newCustomerEmail.trim(),
      address: newCustomerAddress.trim(),
    });
    
    // Find the newly added customer
    const newCustomer = customers.find(c => 
      c.name === newCustomerName.trim() && 
      c.phone === newCustomerPhone.trim()
    );
    
    if (newCustomer) {
      onSelectCustomer(newCustomer.id);
      setSelectedCustomerName(newCustomer.name);
    }
    
    handleCloseAddForm();
    setModalVisible(false);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerAddress('');
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer.id);
    setSelectedCustomerName(customer.name);
    setModalVisible(false);
  };

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'platinum': return <Crown size={14} color="#E5E7EB" />;
      case 'gold': return <Award size={14} color="#F59E0B" />;
      case 'silver': return <Star size={14} color="#6B7280" />;
      default: return <Gift size={14} color="#8B5CF6" />;
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

  return (
    <>
      <View style={styles.container}>
        <Text style={[styles.label, nightMode && styles.labelNight]}>Pelanggan *</Text>
        <TouchableOpacity
          style={[
            styles.selector,
            nightMode && styles.selectorNight,
            !selectedCustomerId && styles.selectorEmpty
          ]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.selectorContent}>
            <User size={20} color={colors.primary} />
            <Text style={[
              styles.selectorText,
              !selectedCustomerId && styles.selectorPlaceholder,
              nightMode && styles.selectorTextNight
            ]}>
              {selectedCustomerName || "Pilih pelanggan"}
            </Text>
          </View>
          <View style={styles.selectorIcon}>
            <Search size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Pilih Pelanggan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            {!showAddForm ? (
              <>
                <View style={styles.searchContainer}>
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
                  <Button
                    title="Tambah"
                    onPress={() => setShowAddForm(true)}
                    size="small"
                    rightElement={<Plus size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                  />
                </View>

                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.customerItem, nightMode && styles.customerItemNight]}
                      onPress={() => handleSelectCustomer(item)}
                    >
                      <View style={styles.customerHeader}>
                        <Text style={[styles.customerName, nightMode && styles.customerNameNight]}>{item.name}</Text>
                        <View style={[
                          styles.membershipBadge,
                          { backgroundColor: `${getMembershipColor(item.membershipLevel)}20` }
                        ]}>
                          {getMembershipIcon(item.membershipLevel)}
                          <Text style={[
                            styles.membershipText,
                            { color: getMembershipColor(item.membershipLevel) }
                          ]}>
                            {item.membershipLevel.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      {item.phone && (
                        <View style={styles.customerContact}>
                          <Phone size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                          <Text style={[styles.customerPhone, nightMode && styles.customerPhoneNight]}>
                            {item.phone}
                          </Text>
                        </View>
                      )}
                      {item.status === 'blacklisted' && (
                        <View style={styles.blacklistWarning}>
                          <Text style={styles.blacklistText}>⚠️ Pelanggan dalam daftar hitam</Text>
                        </View>
                      )}
                      <View style={styles.customerStats}>
                        <Text style={[styles.customerStat, nightMode && styles.customerStatNight]}>
                          💰 {item.totalSpent.toLocaleString()} • 🏆 {item.loyaltyPoints} poin
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.customerList}
                  contentContainerStyle={styles.customerListContent}
                  ListEmptyComponent={
                    <Text style={[styles.emptyText, nightMode && styles.emptyTextNight]}>
                      {searchQuery ? 'Tidak ada pelanggan yang sesuai' : 'Belum ada pelanggan'}
                    </Text>
                  }
                />
              </>
            ) : (
              <View style={styles.addForm}>
                <Input
                  label="Nama Pelanggan"
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholder="Masukkan nama pelanggan"
                />
                <Input
                  label="Nomor Telepon (+628XXXX)"
                  value={newCustomerPhone}
                  onChangeText={setNewCustomerPhone}
                  placeholder="Masukkan nomor telepon"
                  keyboardType="phone-pad"
                />
                <Input
                  label="Email (Opsional)"
                  value={newCustomerEmail}
                  onChangeText={setNewCustomerEmail}
                  placeholder="Masukkan email"
                  keyboardType="email-address"
                />
                <Input
                  label="Alamat (Opsional)"
                  value={newCustomerAddress}
                  onChangeText={setNewCustomerAddress}
                  placeholder="Masukkan alamat"
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.formActions}>
                  <Button
                    title="Batal"
                    onPress={handleCloseAddForm}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                  <Button
                    title="Simpan"
                    onPress={handleAddCustomer}
                    style={styles.saveButton}
                    disabled={!newCustomerName.trim()}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  labelNight: {
    color: colors.gray[100],
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorNight: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[700],
  },
  selectorEmpty: {
    borderColor: colors.border,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  selectorTextNight: {
    color: colors.gray[100],
  },
  selectorPlaceholder: {
    color: colors.textMuted,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalContentNight: {
    backgroundColor: colors.gray[800],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalHeaderNight: {
    borderBottomColor: colors.gray[700],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalTitleNight: {
    color: colors.gray[100],
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12,
  },
  searchBarNight: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
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
  customerList: {
    maxHeight: 400,
  },
  customerListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  customerItemNight: {
    backgroundColor: colors.gray[700],
    borderBottomColor: colors.gray[600],
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  customerNameNight: {
    color: colors.gray[100],
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  membershipText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  customerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 8,
  },
  customerPhoneNight: {
    color: colors.gray[300],
  },
  blacklistWarning: {
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  blacklistText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  customerStats: {
    marginTop: 4,
  },
  customerStat: {
    fontSize: 12,
    color: colors.gray[500],
  },
  customerStatNight: {
    color: colors.gray[400],
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    padding: 16,
  },
  emptyTextNight: {
    color: colors.gray[400],
  },
  addForm: {
    padding: 16,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
  },
});