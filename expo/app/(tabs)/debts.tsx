import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { CustomerSelector } from "@/components/CustomerSelector";
import { colors } from "@/constants/colors";
import { useDebtStore } from "@/store/useDebtStore";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/dateUtils";
import { sendWhatsAppMessage } from "@/utils/whatsappUtils";
import {
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Phone,
  MessageCircle,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react-native";

export default function DebtsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const debts = useDebtStore((state) => state.debts);
  const addDebt = useDebtStore((state) => state.addDebt);
  const payDebt = useDebtStore((state) => state.payDebt);
  const getTotalDebt = useDebtStore((state) => state.getTotalDebt);
  const getCustomerDebts = useDebtStore((state) => state.getCustomerDebts);
  const getOverdueDebts = useDebtStore((state) => state.getOverdueDebts);

  const customers = useCustomerStore((state) => state.customers);
  const getCustomer = useCustomerStore((state) => state.getCustomer);

  const saveTransaction = useTransactionStore((state) => state.saveTransaction);
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);

  const totalDebt = getTotalDebt();
  const overdueDebts = getOverdueDebts();
  const pendingDebts = debts.filter(debt => debt.status === 'pending');

  const filteredDebts = debts.filter(debt => {
    if (filterStatus === 'all') return true;
    return debt.status === filterStatus;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddDebt = () => {
    if (!selectedCustomerId || !amount || !description) {
      Alert.alert("Error", "Mohon lengkapi semua field yang diperlukan");
      return;
    }

    const customer = getCustomer(selectedCustomerId);
    if (!customer) {
      Alert.alert("Error", "Pelanggan tidak ditemukan");
      return;
    }

    const debtAmount = parseFloat(amount);
    if (isNaN(debtAmount) || debtAmount <= 0) {
      Alert.alert("Error", "Jumlah hutang tidak valid");
      return;
    }

    const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;

    addDebt({
      customerId: selectedCustomerId,
      customerName: customer.name,
      amount: debtAmount,
      description,
      dueDate: dueDateTimestamp,
    });

    // Reset form
    setSelectedCustomerId("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setShowAddModal(false);

    Alert.alert("Berhasil", "Hutang berhasil ditambahkan");
  };

  const handlePayDebt = () => {
    if (!selectedDebtId || !paymentAmount) {
      Alert.alert("Error", "Mohon masukkan jumlah pembayaran");
      return;
    }

    const debt = debts.find(d => d.id === selectedDebtId);
    if (!debt) {
      Alert.alert("Error", "Hutang tidak ditemukan");
      return;
    }

    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      Alert.alert("Error", "Jumlah pembayaran tidak valid");
      return;
    }

    if (payment > debt.remainingAmount) {
      Alert.alert("Error", "Jumlah pembayaran melebihi sisa hutang");
      return;
    }

    // Record payment
    payDebt(selectedDebtId, payment, paymentNote);

    // Create transaction record for payment
    const customer = getCustomer(debt.customerId);
    if (customer) {
      saveTransaction(
        "system",
        "Sistem",
        "cash",
        {
          customerId: debt.customerId,
          customerName: customer.name,
          type: "debt_payment",
          debtId: selectedDebtId,
          note: `Pembayaran hutang: ${debt.description}`,
        }
      );
    }

    // Reset form
    setPaymentAmount("");
    setPaymentNote("");
    setSelectedDebtId(null);
    setShowPaymentModal(false);

    Alert.alert("Berhasil", "Pembayaran berhasil dicatat");
  };

  const handleSendReminder = async (debt: any) => {
    const customer = getCustomer(debt.customerId);
    if (!customer || !customer.phone) {
      Alert.alert("Error", "Nomor telepon pelanggan tidak tersedia");
      return;
    }

    const message = `Halo ${customer.name},

Ini adalah pengingat bahwa Anda memiliki hutang di ${storeInfo.name}:

💰 Jumlah: ${formatCurrency(debt.remainingAmount)}
📝 Keterangan: ${debt.description}
📅 Jatuh tempo: ${debt.dueDate ? formatDateTime(debt.dueDate) : 'Belum ditentukan'}

Mohon segera melakukan pembayaran. Terima kasih!

${storeInfo.name}
${storeInfo.phone || ''}`;

    try {
      await sendWhatsAppMessage(customer.phone, message);
      Alert.alert("Berhasil", "Pengingat berhasil dikirim via WhatsApp");
    } catch (error) {
      Alert.alert("Error", "Gagal mengirim pengingat");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'overdue':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} color={colors.success} />;
      case 'pending':
        return <Clock size={16} color={colors.warning} />;
      case 'overdue':
        return <AlertTriangle size={16} color={colors.error} />;
      default:
        return <CreditCard size={16} color={colors.textMuted} />;
    }
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
            💼 Manajemen Hutang
          </Text>
          <Text style={[
            styles.subtitle, 
            nightMode && styles.subtitleNight,
            busyMode && styles.subtitleBusy
          ]}>
            Kelola hutang pelanggan dengan mudah
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card variant="luxury" style={[styles.statCard, nightMode && styles.statCardNight]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
                <DollarSign size={busyMode ? 28 : 24} color={colors.error} />
              </View>
              <TrendingUp size={16} color={colors.error} />
            </View>
            <Text style={[
              styles.statValue, 
              nightMode && styles.statValueNight,
              busyMode && styles.statValueBusy
            ]}>
              {formatCurrency(totalDebt)}
            </Text>
            <Text style={[
              styles.statLabel, 
              nightMode && styles.statLabelNight,
              busyMode && styles.statLabelBusy
            ]}>
              Total Hutang
            </Text>
          </Card>

          <Card variant="luxury" style={[styles.statCard, nightMode && styles.statCardNight]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Users size={busyMode ? 28 : 24} color={colors.warning} />
              </View>
              <Clock size={16} color={colors.warning} />
            </View>
            <Text style={[
              styles.statValue, 
              nightMode && styles.statValueNight,
              busyMode && styles.statValueBusy
            ]}>
              {pendingDebts.length}
            </Text>
            <Text style={[
              styles.statLabel, 
              nightMode && styles.statLabelNight,
              busyMode && styles.statLabelBusy
            ]}>
              Hutang Aktif
            </Text>
          </Card>
        </View>

        {/* Overdue Alert */}
        {overdueDebts.length > 0 && (
          <Card variant="luxury" style={[styles.alertCard, nightMode && styles.alertCardNight]}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={[styles.alertTitle, nightMode && styles.alertTitleNight]}>
                Hutang Jatuh Tempo
              </Text>
            </View>
            <Text style={[styles.alertText, nightMode && styles.alertTextNight]}>
              {overdueDebts.length} hutang telah melewati batas waktu pembayaran
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="➕ Tambah Hutang"
            onPress={() => setShowAddModal(true)}
            variant="primary"
            style={[styles.actionButton, busyMode && styles.actionButtonBusy]}
          />
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabs, nightMode && styles.filterTabsNight]}>
          {[
            { key: 'all', label: 'Semua', count: debts.length },
            { key: 'pending', label: 'Belum Lunas', count: pendingDebts.length },
            { key: 'paid', label: 'Lunas', count: debts.filter(d => d.status === 'paid').length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filterStatus === tab.key && styles.filterTabActive,
                nightMode && styles.filterTabNight,
                filterStatus === tab.key && nightMode && styles.filterTabActiveNight,
                busyMode && styles.filterTabBusy,
              ]}
              onPress={() => setFilterStatus(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterTabText,
                filterStatus === tab.key && styles.filterTabTextActive,
                nightMode && styles.filterTabTextNight,
                filterStatus === tab.key && nightMode && styles.filterTabTextActiveNight,
                busyMode && styles.filterTabTextBusy,
              ]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Debts List */}
        <View style={styles.debtsList}>
          {filteredDebts.length > 0 ? (
            filteredDebts.map((debt) => {
              const customer = getCustomer(debt.customerId);
              const isOverdue = debt.dueDate && debt.dueDate < Date.now() && debt.status === 'pending';
              
              return (
                <Card 
                  key={debt.id} 
                  variant="luxury" 
                  style={[
                    styles.debtCard, 
                    nightMode && styles.debtCardNight,
                    isOverdue && styles.debtCardOverdue,
                    busyMode && styles.debtCardBusy
                  ]}
                >
                  <View style={styles.debtHeader}>
                    <View style={styles.debtCustomer}>
                      <View style={[styles.customerIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <User size={20} color={colors.primary} />
                      </View>
                      <View style={styles.customerInfo}>
                        <Text style={[
                          styles.customerName, 
                          nightMode && styles.customerNameNight,
                          busyMode && styles.customerNameBusy
                        ]}>
                          {debt.customerName}
                        </Text>
                        {customer?.phone && (
                          <View style={styles.customerPhone}>
                            <Phone size={12} color={nightMode ? colors.gray[400] : colors.textMuted} />
                            <Text style={[
                              styles.phoneText, 
                              nightMode && styles.phoneTextNight,
                              busyMode && styles.phoneTextBusy
                            ]}>
                              {customer.phone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.debtStatus}>
                      {getStatusIcon(debt.status)}
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(debt.status) },
                        busyMode && styles.statusTextBusy
                      ]}>
                        {debt.status === 'paid' ? 'Lunas' : 
                         debt.status === 'pending' ? 'Belum Lunas' : 'Jatuh Tempo'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.debtDetails}>
                    <Text style={[
                      styles.debtDescription, 
                      nightMode && styles.debtDescriptionNight,
                      busyMode && styles.debtDescriptionBusy
                    ]}>
                      {debt.description}
                    </Text>
                    
                    <View style={styles.debtAmounts}>
                      <View style={styles.amountRow}>
                        <Text style={[
                          styles.amountLabel, 
                          nightMode && styles.amountLabelNight,
                          busyMode && styles.amountLabelBusy
                        ]}>
                          Total Hutang:
                        </Text>
                        <Text style={[
                          styles.amountValue, 
                          nightMode && styles.amountValueNight,
                          busyMode && styles.amountValueBusy
                        ]}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>
                      
                      {debt.paidAmount > 0 && (
                        <View style={styles.amountRow}>
                          <Text style={[
                            styles.amountLabel, 
                            nightMode && styles.amountLabelNight,
                            busyMode && styles.amountLabelBusy
                          ]}>
                            Sudah Dibayar:
                          </Text>
                          <Text style={[
                            styles.amountValue,
                            { color: colors.success },
                            busyMode && styles.amountValueBusy
                          ]}>
                            {formatCurrency(debt.paidAmount)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.amountRow}>
                        <Text style={[
                          styles.amountLabel, 
                          nightMode && styles.amountLabelNight,
                          busyMode && styles.amountLabelBusy
                        ]}>
                          Sisa Hutang:
                        </Text>
                        <Text style={[
                          styles.amountValue,
                          { color: debt.status === 'paid' ? colors.success : colors.error },
                          busyMode && styles.amountValueBusy
                        ]}>
                          {formatCurrency(debt.remainingAmount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.debtMeta}>
                      <View style={styles.metaItem}>
                        <Calendar size={14} color={nightMode ? colors.gray[400] : colors.textMuted} />
                        <Text style={[
                          styles.metaText, 
                          nightMode && styles.metaTextNight,
                          busyMode && styles.metaTextBusy
                        ]}>
                          Dibuat: {formatDateTime(debt.createdAt)}
                        </Text>
                      </View>
                      
                      {debt.dueDate && (
                        <View style={styles.metaItem}>
                          <Clock size={14} color={isOverdue ? colors.error : (nightMode ? colors.gray[400] : colors.textMuted)} />
                          <Text style={[
                            styles.metaText,
                            nightMode && styles.metaTextNight,
                            isOverdue && { color: colors.error },
                            busyMode && styles.metaTextBusy
                          ]}>
                            Jatuh tempo: {formatDateTime(debt.dueDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {debt.status === 'pending' && (
                    <View style={styles.debtActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.payBtn, busyMode && styles.actionBtnBusy]}
                        onPress={() => {
                          setSelectedDebtId(debt.id);
                          setShowPaymentModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={16} color="#FFFFFF" />
                        <Text style={[styles.actionBtnText, busyMode && styles.actionBtnTextBusy]}>
                          Bayar
                        </Text>
                      </TouchableOpacity>
                      
                      {customer?.phone && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.reminderBtn, busyMode && styles.actionBtnBusy]}
                          onPress={() => handleSendReminder(debt)}
                          activeOpacity={0.8}
                        >
                          <MessageCircle size={16} color={colors.primary} />
                          <Text style={[
                            styles.actionBtnText,
                            { color: colors.primary },
                            busyMode && styles.actionBtnTextBusy
                          ]}>
                            Ingatkan
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Card>
              );
            })
          ) : (
            <Card variant="luxury" style={[styles.emptyCard, nightMode && styles.emptyCardNight]}>
              <View style={styles.emptyState}>
                <CreditCard size={48} color={nightMode ? colors.gray[600] : colors.textMuted} />
                <Text style={[
                  styles.emptyTitle, 
                  nightMode && styles.emptyTitleNight,
                  busyMode && styles.emptyTitleBusy
                ]}>
                  Belum Ada Hutang
                </Text>
                <Text style={[
                  styles.emptyText, 
                  nightMode && styles.emptyTextNight,
                  busyMode && styles.emptyTextBusy
                ]}>
                  {filterStatus === 'all' 
                    ? 'Belum ada catatan hutang pelanggan'
                    : `Tidak ada hutang dengan status ${filterStatus === 'pending' ? 'belum lunas' : 'lunas'}`
                  }
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Debt Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Tambah Hutang Baru
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <CustomerSelector
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
                customers={customers}
                placeholder="Pilih Pelanggan"
                nightMode={nightMode}
              />

              <Input
                label="Jumlah Hutang"
                value={amount}
                onChangeText={setAmount}
                placeholder="Masukkan jumlah hutang"
                keyboardType="numeric"
                style={styles.input}
              />

              <Input
                label="Keterangan"
                value={description}
                onChangeText={setDescription}
                placeholder="Keterangan hutang (contoh: Pembelian barang)"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <Input
                label="Tanggal Jatuh Tempo (Opsional)"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Batal"
                  onPress={() => setShowAddModal(false)}
                  variant="secondary"
                  style={styles.modalButton}
                />
                <Button
                  title="Simpan"
                  onPress={handleAddDebt}
                  variant="primary"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                Pembayaran Hutang
              </Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedDebtId && (() => {
                const debt = debts.find(d => d.id === selectedDebtId);
                return debt ? (
                  <View style={[styles.debtSummary, nightMode && styles.debtSummaryNight]}>
                    <Text style={[styles.summaryTitle, nightMode && styles.summaryTitleNight]}>
                      Ringkasan Hutang
                    </Text>
                    <Text style={[styles.summaryText, nightMode && styles.summaryTextNight]}>
                      Pelanggan: {debt.customerName}
                    </Text>
                    <Text style={[styles.summaryText, nightMode && styles.summaryTextNight]}>
                      Keterangan: {debt.description}
                    </Text>
                    <Text style={[styles.summaryText, nightMode && styles.summaryTextNight]}>
                      Sisa Hutang: {formatCurrency(debt.remainingAmount)}
                    </Text>
                  </View>
                ) : null;
              })()}

              <Input
                label="Jumlah Pembayaran"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Masukkan jumlah yang dibayar"
                keyboardType="numeric"
                style={styles.input}
              />

              <Input
                label="Catatan Pembayaran (Opsional)"
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder="Catatan tambahan"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Batal"
                  onPress={() => setShowPaymentModal(false)}
                  variant="secondary"
                  style={styles.modalButton}
                />
                <Button
                  title="Bayar"
                  onPress={handlePayDebt}
                  variant="primary"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
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
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 20,
  },
  statCardNight: {
    backgroundColor: colors.gray[800],
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
  },
  statLabelNight: {
    color: colors.night.textSecondary,
  },
  statLabelBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  alertCard: {
    marginBottom: 24,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertCardNight: {
    backgroundColor: colors.gray[800],
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
    marginLeft: 8,
  },
  alertTitleNight: {
    color: colors.error,
  },
  alertText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  alertTextNight: {
    color: colors.night.textSecondary,
  },
  actionButtons: {
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
  actionButtonBusy: {
    paddingVertical: 16,
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  filterTabsNight: {
    backgroundColor: colors.gray[800],
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabNight: {
    backgroundColor: "transparent",
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabActiveNight: {
    backgroundColor: colors.primary,
  },
  filterTabBusy: {
    paddingVertical: 16,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTabTextNight: {
    color: colors.night.textSecondary,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  filterTabTextActiveNight: {
    color: "#FFFFFF",
  },
  filterTabTextBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  debtsList: {
    gap: 16,
  },
  debtCard: {
    padding: 20,
  },
  debtCardNight: {
    backgroundColor: colors.gray[800],
  },
  debtCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  debtCardBusy: {
    padding: 24,
  },
  debtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  debtCustomer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  customerNameNight: {
    color: colors.night.text,
  },
  customerNameBusy: {
    fontSize: 18,
    fontWeight: "700",
  },
  customerPhone: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  phoneTextNight: {
    color: colors.night.textMuted,
  },
  phoneTextBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  debtStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusTextBusy: {
    fontSize: 14,
    fontWeight: "700",
  },
  debtDetails: {
    marginBottom: 16,
  },
  debtDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  debtDescriptionNight: {
    color: colors.night.textSecondary,
  },
  debtDescriptionBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  debtAmounts: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  amountLabelNight: {
    color: colors.night.textMuted,
  },
  amountLabelBusy: {
    fontSize: 16,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  amountValueNight: {
    color: colors.night.text,
  },
  amountValueBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  debtMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  metaTextNight: {
    color: colors.night.textMuted,
  },
  metaTextBusy: {
    fontSize: 14,
    fontWeight: "500",
  },
  debtActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnBusy: {
    paddingVertical: 16,
  },
  payBtn: {
    backgroundColor: colors.primary,
  },
  reminderBtn: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionBtnTextBusy: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyCard: {
    padding: 40,
  },
  emptyCardNight: {
    backgroundColor: colors.gray[800],
  },
  emptyState: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleNight: {
    color: colors.night.text,
  },
  emptyTitleBusy: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyTextNight: {
    color: colors.night.textMuted,
  },
  emptyTextBusy: {
    fontSize: 16,
    fontWeight: "500",
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
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  debtSummary: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  debtSummaryNight: {
    backgroundColor: colors.gray[700],
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  summaryTitleNight: {
    color: colors.night.text,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryTextNight: {
    color: colors.night.textSecondary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});