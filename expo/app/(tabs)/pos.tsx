import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "@/constants/colors";
import { CartItem } from "@/components/CartItem";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { CustomerSelector } from "@/components/CustomerSelector";
import { DatePicker } from "@/components/DatePicker";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useProductStore } from "@/store/useProductStore";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useDebtStore } from "@/store/useDebtStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency, formatCompactCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateUtils";
import { Product, Customer } from "@/types";
import { Search, X, CreditCard, Banknote, QrCode, Calendar, Grid, List, Lightbulb, Camera } from "lucide-react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type PaymentMethod = 'cash' | 'debt' | 'qris';

export default function POSScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Debt payment states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [debtNotes, setDebtNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // QRIS states
  const [showQRISModal, setShowQRISModal] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);

  const cart = useTransactionStore((state) => state.cart);
  const addToCart = useTransactionStore((state) => state.addToCart);
  const updateCartItem = useTransactionStore((state) => state.updateCartItem);
  const removeFromCart = useTransactionStore((state) => state.removeFromCart);
  const clearCart = useTransactionStore((state) => state.clearCart);
  const setStoreDiscount = useTransactionStore((state) => state.setDiscount);
  const setStoreAmountPaid = useTransactionStore((state) => state.setAmountPaid);
  const saveTransaction = useTransactionStore((state) => state.saveTransaction);

  const products = useProductStore((state) => state.products);
  const addDebt = useDebtStore((state) => state.addDebt);
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const busyMode = useSettingsStore((state) => state.busyMode);
  const nightMode = useSettingsStore((state) => state.nightMode);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountValue = parseFloat(discount) || 0;
  const total = subtotal - discountValue;
  const amountPaidValue = parseFloat(amountPaid) || 0;
  const change = amountPaidValue - total;

  // Auto change suggestions
  const getChangeSuggestions = (changeAmount: number) => {
    if (changeAmount <= 0) return [];
    
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100];
    const suggestions = [];
    let remaining = changeAmount;
    
    for (const denom of denominations) {
      const count = Math.floor(remaining / denom);
      if (count > 0) {
        suggestions.push({ denomination: denom, count });
        remaining = remaining % denom;
      }
    }
    
    return suggestions;
  };

  const changeSuggestions = getChangeSuggestions(change);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (text.length > 0) {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(text.toLowerCase()) ||
          product.code.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    addToCart({
      ...product,
      quantity: 1,
      subtotal: product.sellPrice,
    });
    setSearchQuery("");
    setShowResults(false);
    searchInputRef.current?.blur();
  };

  const handleUpdateDiscount = (text: string) => {
    setDiscount(text);
    setStoreDiscount(parseFloat(text) || 0);
  };

  const handleUpdateAmountPaid = (text: string) => {
    setAmountPaid(text);
    setStoreAmountPaid(parseFloat(text) || 0);
  };

  const resetForm = () => {
    clearCart();
    setDiscount("");
    setAmountPaid("");
    setSelectedCustomer(null);
    setDebtNotes("");
    setDueDate("");
  };

  const handleCashPayment = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }

    if (total > amountPaidValue) {
      Alert.alert("Error", "Uang yang dibayarkan kurang");
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      const transaction = saveTransaction("1", "Kasir");
      
      setSuccessData({
        paymentMethod: 'cash',
        total: transaction.total,
        change: transaction.change,
      });
      
      setIsProcessing(false);
      setShowPaymentSuccess(true);
      resetForm();
    }, 800);
  };

  const handleDebtPayment = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }

    if (!selectedCustomer) {
      Alert.alert("Error", "Pilih pelanggan terlebih dahulu");
      return;
    }

    if (!dueDate) {
      Alert.alert("Error", "Tentukan tanggal jatuh tempo");
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      const remainingDebt = total - amountPaidValue;
      
      // Save as debt
      const debt = addDebt({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items: [...cart],
        subtotal,
        discount: discountValue,
        total,
        amountPaid: amountPaidValue,
        remainingDebt,
        dueDate: new Date(dueDate).getTime(),
        notes: debtNotes,
        status: remainingDebt > 0 ? 'unpaid' : 'paid',
      });

      // Also save as transaction
      const transaction = saveTransaction("1", "Kasir");
      
      setSuccessData({
        paymentMethod: 'debt',
        total: transaction.total,
        customerName: selectedCustomer.name,
        remainingDebt,
      });
      
      setIsProcessing(false);
      setShowPaymentSuccess(true);
      resetForm();
    }, 800);
  };

  const handleQRISPayment = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }

    if (!storeInfo.qrisImage) {
      Alert.alert("Error", "QRIS belum dikonfigurasi. Silakan atur di menu Pengaturan.");
      return;
    }

    setShowQRISModal(true);
  };

  const confirmQRISPayment = () => {
    setShowQRISModal(false);
    setIsProcessing(true);
    
    setTimeout(() => {
      const transaction = saveTransaction("1", "Kasir");
      
      setSuccessData({
        paymentMethod: 'qris',
        total: transaction.total,
      });
      
      setIsProcessing(false);
      setShowPaymentSuccess(true);
      resetForm();
    }, 800);
  };

  const handleCheckout = () => {
    switch (paymentMethod) {
      case 'cash':
        handleCashPayment();
        break;
      case 'debt':
        handleDebtPayment();
        break;
      case 'qris':
        handleQRISPayment();
        break;
    }
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default 7 days from now
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (selectedDate: string) => {
    setDueDate(selectedDate);
    setShowDatePicker(false);
  };

  const isCheckoutDisabled = () => {
    if (cart.length === 0 || isProcessing) return true;
    
    switch (paymentMethod) {
      case 'cash':
        return total > amountPaidValue;
      case 'debt':
        return !selectedCustomer || !dueDate;
      case 'qris':
        return false;
      default:
        return true;
    }
  };

  const renderProductGrid = () => {
    const favoriteProducts = products.slice(0, 12); // Show first 12 products as favorites
    
    return (
      <View style={styles.productGrid}>
        <Text style={[styles.gridTitle, nightMode && styles.gridTitleNight]}>Produk Favorit</Text>
        <View style={styles.gridContainer}>
          {favoriteProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productGridItem,
                nightMode && styles.productGridItemNight,
                busyMode && styles.productGridItemBusy
              ]}
              onPress={() => handleSelectProduct(product)}
            >
              <View style={styles.productImagePlaceholder}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <Text style={styles.productImageText}>
                    {product.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text 
                style={[
                  styles.productGridName,
                  nightMode && styles.productGridNameNight,
                  busyMode && styles.productGridNameBusy
                ]} 
                numberOfLines={2}
              >
                {product.name}
              </Text>
              <Text 
                style={[
                  styles.productGridPrice,
                  busyMode && styles.productGridPriceBusy
                ]}
              >
                {busyMode ? formatCompactCurrency(product.sellPrice) : formatCurrency(product.sellPrice)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  const paymentContainerStyle = [
    styles.paymentContainer,
    nightMode && styles.paymentContainerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.searchContainer, nightMode && styles.searchContainerNight]}>
          <View style={styles.searchHeader}>
            <Input
              placeholder="Cari produk (nama atau kode)"
              value={searchQuery}
              onChangeText={handleSearch}
              containerStyle={styles.searchInputContainer}
              style={nightMode && styles.searchInputNight}
              rightElement={
                searchQuery ? (
                  <TouchableOpacity onPress={() => handleSearch("")}>
                    <X size={20} color={nightMode ? colors.gray[400] : colors.gray[500]} />
                  </TouchableOpacity>
                ) : (
                  <Search size={20} color={nightMode ? colors.gray[400] : colors.gray[500]} />
                )
              }
            />
            
            <View style={[styles.viewToggle, nightMode && styles.viewToggleNight]}>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  nightMode && styles.viewToggleButtonNight,
                  viewMode === 'list' && styles.viewToggleButtonActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <List size={18} color={viewMode === 'list' ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  nightMode && styles.viewToggleButtonNight,
                  viewMode === 'grid' && styles.viewToggleButtonActive
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Grid size={18} color={viewMode === 'grid' ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {showResults && searchResults.length > 0 && (
            <View style={[styles.searchResults, nightMode && styles.searchResultsNight]}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchResultItem, nightMode && styles.searchResultItemNight]}
                    onPress={() => handleSelectProduct(item)}
                  >
                    <Text style={[styles.searchResultName, nightMode && styles.searchResultNameNight]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.searchResultCode, nightMode && styles.searchResultCodeNight]}>
                      {item.code}
                    </Text>
                    <Text style={styles.searchResultPrice}>
                      {formatCurrency(item.sellPrice)}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
              />
            </View>
          )}
        </View>

        <View style={[styles.cartContainer, nightMode && styles.cartContainerNight]}>
          {viewMode === 'grid' && !showResults ? (
            renderProductGrid()
          ) : (
            <>
              <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>Keranjang</Text>
              {cart.length > 0 ? (
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <CartItem
                      item={item}
                      onUpdateQuantity={updateCartItem}
                      onRemove={removeFromCart}
                    />
                  )}
                  style={styles.cartList}
                />
              ) : (
                <View style={styles.emptyCart}>
                  <Text style={[styles.emptyCartText, nightMode && styles.emptyCartTextNight]}>
                    Keranjang kosong
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={paymentContainerStyle}>
          <ScrollView 
            style={styles.paymentScrollView}
            contentContainerStyle={styles.paymentScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Payment Method Selector */}
            <View style={[styles.paymentMethodContainer, nightMode && styles.paymentMethodContainerNight]}>
              <Text style={[styles.paymentMethodTitle, nightMode && styles.paymentMethodTitleNight]}>
                Metode Pembayaran
              </Text>
              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    nightMode && styles.paymentMethodButtonNight,
                    busyMode && styles.paymentMethodButtonBusy,
                    paymentMethod === 'cash' && styles.activePaymentMethod,
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Banknote size={busyMode ? 24 : 18} color={paymentMethod === 'cash' ? '#FFFFFF' : colors.primary} />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      nightMode && styles.paymentMethodTextNight,
                      busyMode && styles.paymentMethodTextBusy,
                      paymentMethod === 'cash' && styles.activePaymentMethodText,
                    ]}
                  >
                    Tunai
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    nightMode && styles.paymentMethodButtonNight,
                    busyMode && styles.paymentMethodButtonBusy,
                    paymentMethod === 'debt' && styles.activePaymentMethod,
                  ]}
                  onPress={() => setPaymentMethod('debt')}
                >
                  <CreditCard size={busyMode ? 24 : 18} color={paymentMethod === 'debt' ? '#FFFFFF' : colors.primary} />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      nightMode && styles.paymentMethodTextNight,
                      busyMode && styles.paymentMethodTextBusy,
                      paymentMethod === 'debt' && styles.activePaymentMethodText,
                    ]}
                  >
                    Hutang
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    nightMode && styles.paymentMethodButtonNight,
                    busyMode && styles.paymentMethodButtonBusy,
                    paymentMethod === 'qris' && styles.activePaymentMethod,
                  ]}
                  onPress={() => setPaymentMethod('qris')}
                >
                  <QrCode size={busyMode ? 24 : 18} color={paymentMethod === 'qris' ? '#FFFFFF' : colors.primary} />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      nightMode && styles.paymentMethodTextNight,
                      busyMode && styles.paymentMethodTextBusy,
                      paymentMethod === 'qris' && styles.activePaymentMethodText,
                    ]}
                  >
                    QRIS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={[
                  styles.summaryLabel, 
                  nightMode && styles.summaryLabelNight,
                  busyMode && styles.summaryLabelBusy
                ]}>
                  Subtotal
                </Text>
                <Text style={[
                  styles.summaryValue, 
                  nightMode && styles.summaryValueNight,
                  busyMode && styles.summaryValueBusy
                ]}>
                  {busyMode ? formatCompactCurrency(subtotal) : formatCurrency(subtotal)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[
                  styles.summaryLabel, 
                  nightMode && styles.summaryLabelNight,
                  busyMode && styles.summaryLabelBusy
                ]}>
                  Diskon
                </Text>
                <Input
                  value={discount}
                  onChangeText={handleUpdateDiscount}
                  placeholder="0"
                  keyboardType="numeric"
                  containerStyle={styles.discountInput}
                  inputStyle={[
                    styles.summaryInput, 
                    nightMode && styles.summaryInputNight,
                    busyMode && styles.summaryInputBusy
                  ]}
                />
              </View>

              <View style={styles.summaryRow}>
                <Text style={[
                  styles.summaryLabel, 
                  nightMode && styles.summaryLabelNight,
                  busyMode && styles.summaryLabelBusy
                ]}>
                  Total
                </Text>
                <Text style={[
                  styles.totalValue, 
                  nightMode && styles.totalValueNight,
                  busyMode && styles.totalValueBusy
                ]}>
                  {busyMode ? formatCompactCurrency(total) : formatCurrency(total)}
                </Text>
              </View>

              {/* Payment Method Specific Fields */}
              {paymentMethod === 'cash' && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel, 
                      nightMode && styles.summaryLabelNight,
                      busyMode && styles.summaryLabelBusy
                    ]}>
                      Dibayar
                    </Text>
                    <Input
                      value={amountPaid}
                      onChangeText={handleUpdateAmountPaid}
                      placeholder="0"
                      keyboardType="numeric"
                      containerStyle={styles.amountPaidInput}
                      inputStyle={[
                        styles.summaryInput, 
                        nightMode && styles.summaryInputNight,
                        busyMode && styles.summaryInputBusy
                      ]}
                    />
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel, 
                      nightMode && styles.summaryLabelNight,
                      busyMode && styles.summaryLabelBusy
                    ]}>
                      Kembalian
                    </Text>
                    <Text
                      style={[
                        styles.changeValue,
                        nightMode && styles.changeValueNight,
                        busyMode && styles.changeValueBusy,
                        { color: change >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {busyMode ? formatCompactCurrency(change) : formatCurrency(change)}
                    </Text>
                  </View>

                  {/* Change Suggestions */}
                  {change > 0 && changeSuggestions.length > 0 && (
                    <View style={[styles.changeSuggestionsContainer, nightMode && styles.changeSuggestionsContainerNight]}>
                      <View style={styles.changeSuggestionsHeader}>
                        <Lightbulb size={16} color={colors.primary} />
                        <Text style={[styles.changeSuggestionsTitle, nightMode && styles.changeSuggestionsTitleNight]}>
                          Saran Pecahan:
                        </Text>
                      </View>
                      <View style={styles.changeSuggestions}>
                        {changeSuggestions.map((suggestion, index) => (
                          <Text key={index} style={[
                            styles.changeSuggestionItem,
                            nightMode && styles.changeSuggestionItemNight
                          ]}>
                            {suggestion.count}x{formatCompactCurrency(suggestion.denomination)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              {paymentMethod === 'debt' && (
                <>
                  <TouchableOpacity
                    style={[styles.customerSelector, nightMode && styles.customerSelectorNight]}
                    onPress={() => setShowCustomerSelector(true)}
                  >
                    <Text style={[
                      styles.customerSelectorLabel, 
                      nightMode && styles.customerSelectorLabelNight,
                      busyMode && styles.customerSelectorLabelBusy
                    ]}>
                      Pelanggan
                    </Text>
                    <Text style={[
                      styles.customerSelectorValue, 
                      busyMode && styles.customerSelectorValueBusy
                    ]}>
                      {selectedCustomer ? selectedCustomer.name : 'Pilih Pelanggan'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel, 
                      nightMode && styles.summaryLabelNight,
                      busyMode && styles.summaryLabelBusy
                    ]}>
                      Dibayar Sekarang
                    </Text>
                    <Input
                      value={amountPaid}
                      onChangeText={handleUpdateAmountPaid}
                      placeholder="0"
                      keyboardType="numeric"
                      containerStyle={styles.amountPaidInput}
                      inputStyle={[
                        styles.summaryInput, 
                        nightMode && styles.summaryInputNight,
                        busyMode && styles.summaryInputBusy
                      ]}
                    />
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel, 
                      nightMode && styles.summaryLabelNight,
                      busyMode && styles.summaryLabelBusy
                    ]}>
                      Sisa Hutang
                    </Text>
                    <Text style={[
                      styles.debtValue, 
                      nightMode && styles.debtValueNight,
                      busyMode && styles.debtValueBusy
                    ]}>
                      {busyMode ? formatCompactCurrency(total - amountPaidValue) : formatCurrency(total - amountPaidValue)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.dateSelector, nightMode && styles.dateSelectorNight]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[
                      styles.dateSelectorLabel, 
                      nightMode && styles.dateSelectorLabelNight,
                      busyMode && styles.dateSelectorLabelBusy
                    ]}>
                      Jatuh Tempo
                    </Text>
                    <View style={styles.dateSelectorValue}>
                      <Text style={[
                        styles.dateSelectorText, 
                        busyMode && styles.dateSelectorTextBusy
                      ]}>
                        {dueDate ? formatDate(new Date(dueDate).getTime()) : 'Pilih Tanggal'}
                      </Text>
                      <Calendar size={20} color={colors.primary} />
                    </View>
                  </TouchableOpacity>

                  <Input
                    label="Catatan (Opsional)"
                    value={debtNotes}
                    onChangeText={setDebtNotes}
                    placeholder="Catatan hutang"
                    containerStyle={styles.notesInput}
                    style={nightMode && styles.inputNight}
                    multiline
                    numberOfLines={2}
                  />
                </>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  nightMode && styles.cancelButtonNight,
                  busyMode && styles.cancelButtonBusy
                ]}
                onPress={() => {
                  Alert.alert(
                    "Konfirmasi",
                    "Apakah Anda yakin ingin membatalkan transaksi ini?",
                    [
                      { text: "Tidak" },
                      {
                        text: "Ya",
                        onPress: resetForm,
                      },
                    ]
                  );
                }}
                disabled={isProcessing}
              >
                <Text style={[
                  styles.cancelButtonText,
                  nightMode && styles.cancelButtonTextNight,
                  busyMode && styles.cancelButtonTextBusy
                ]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  busyMode && styles.checkoutButtonBusy,
                  isCheckoutDisabled() && styles.disabledButton
                ]}
                onPress={handleCheckout}
                disabled={isCheckoutDisabled()}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[
                    styles.checkoutButtonText,
                    busyMode && styles.checkoutButtonTextBusy
                  ]}>
                    Bayar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Customer Selector Modal */}
      <CustomerSelector
        visible={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        onSelectCustomer={setSelectedCustomer}
      />

      {/* Date Picker Modal */}
      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={handleDateSelect}
        selectedDate={dueDate}
        minDate={new Date().toISOString().split('T')[0]}
      />

      {/* QRIS Payment Modal */}
      <Modal
        visible={showQRISModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRISModal(false)}
      >
        <View style={styles.qrisModalContainer}>
          <View style={[styles.qrisModalContent, nightMode && styles.qrisModalContentNight]}>
            <View style={[styles.qrisHeader, nightMode && styles.qrisHeaderNight]}>
              <Text style={[styles.qrisTitle, nightMode && styles.qrisTitleNight]}>Pembayaran QRIS</Text>
              <TouchableOpacity
                onPress={() => setShowQRISModal(false)}
                style={styles.qrisCloseButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrisBody}>
              <Text style={[styles.qrisAmount, nightMode && styles.qrisAmountNight]}>
                Total: {formatCurrency(total)}
              </Text>
              
              {storeInfo.qrisImage ? (
                <Image
                  source={{ uri: storeInfo.qrisImage }}
                  style={styles.qrisImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.qrisPlaceholder, nightMode && styles.qrisPlaceholderNight]}>
                  <QrCode size={100} color={colors.gray[400]} />
                  <Text style={[styles.qrisPlaceholderText, nightMode && styles.qrisPlaceholderTextNight]}>
                    QRIS belum dikonfigurasi
                  </Text>
                </View>
              )}
              
              <Text style={[styles.qrisInstructions, nightMode && styles.qrisInstructionsNight]}>
                Scan QR Code di atas dengan aplikasi pembayaran digital Anda
              </Text>
              
              <View style={styles.qrisActions}>
                <TouchableOpacity
                  style={[styles.qrisCancelButton, nightMode && styles.qrisCancelButtonNight]}
                  onPress={() => setShowQRISModal(false)}
                >
                  <Text style={styles.qrisCancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.qrisConfirmButton}
                  onPress={confirmQRISPayment}
                >
                  <Text style={styles.qrisConfirmButtonText}>Konfirmasi Pembayaran</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        visible={showPaymentSuccess}
        onClose={() => setShowPaymentSuccess(false)}
        paymentMethod={successData.paymentMethod}
        total={successData.total}
        change={successData.change}
        customerName={successData.customerName}
        remainingDebt={successData.remainingDebt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  containerNight: {
    backgroundColor: colors.gray[900],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 32,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    zIndex: 10,
  },
  searchContainerNight: {
    backgroundColor: colors.gray[800],
    borderBottomColor: colors.gray[700],
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  searchInputNight: {
    backgroundColor: colors.gray[700],
    color: colors.gray[100],
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  viewToggleNight: {
    backgroundColor: colors.gray[700],
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewToggleButtonNight: {
    backgroundColor: 'transparent',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  searchResults: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  searchResultsNight: {
    backgroundColor: colors.gray[800],
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchResultItemNight: {
    borderBottomColor: colors.gray[700],
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  searchResultNameNight: {
    color: colors.gray[100],
  },
  searchResultCode: {
    fontSize: 14,
    color: colors.gray[600],
  },
  searchResultCodeNight: {
    color: colors.gray[400],
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  cartContainer: {
    flex: 1,
    padding: 16,
    minHeight: 200,
  },
  cartContainerNight: {
    backgroundColor: colors.gray[900],
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
  cartList: {
    flex: 1,
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  emptyCartTextNight: {
    color: colors.gray[400],
  },
  // Product Grid Styles
  productGrid: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  gridTitleNight: {
    color: colors.gray[100],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productGridItem: {
    width: (screenWidth - 48) / 3,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productGridItemNight: {
    backgroundColor: colors.gray[800],
  },
  productGridItemBusy: {
    padding: 16,
    width: (screenWidth - 32) / 2,
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  productImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  productGridName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  productGridNameNight: {
    color: colors.gray[100],
  },
  productGridNameBusy: {
    fontSize: 16,
  },
  productGridPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  productGridPriceBusy: {
    fontSize: 14,
  },
  paymentContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    minHeight: screenHeight * 0.4,
    maxHeight: screenHeight * 0.6,
  },
  paymentContainerNight: {
    backgroundColor: colors.gray[800],
    borderTopColor: colors.gray[700],
  },
  paymentScrollView: {
    flex: 1,
  },
  paymentScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flexGrow: 1,
  },
  paymentMethodContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  paymentMethodContainerNight: {
    borderBottomColor: colors.gray[700],
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  paymentMethodTitleNight: {
    color: colors.gray[100],
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 48,
  },
  paymentMethodButtonNight: {
    borderColor: colors.primary,
  },
  paymentMethodButtonBusy: {
    paddingVertical: 16,
    minHeight: 60,
  },
  activePaymentMethod: {
    backgroundColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
    marginLeft: 6,
  },
  paymentMethodTextNight: {
    color: colors.primary,
  },
  paymentMethodTextBusy: {
    fontSize: 16,
  },
  activePaymentMethodText: {
    color: "#FFFFFF",
  },
  summaryContainer: {
    padding: 16,
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryLabelNight: {
    color: colors.gray[100],
  },
  summaryLabelBusy: {
    fontSize: 18,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  summaryValueNight: {
    color: colors.gray[100],
  },
  summaryValueBusy: {
    fontSize: 18,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  totalValueNight: {
    color: colors.gray[100],
  },
  totalValueBusy: {
    fontSize: 22,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  changeValueNight: {
    color: colors.gray[100],
  },
  changeValueBusy: {
    fontSize: 22,
  },
  debtValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  debtValueNight: {
    color: colors.error,
  },
  debtValueBusy: {
    fontSize: 18,
  },
  discountInput: {
    width: 120,
    marginBottom: 0,
  },
  amountPaidInput: {
    width: 120,
    marginBottom: 0,
  },
  summaryInput: {
    textAlign: "right",
  },
  summaryInputNight: {
    backgroundColor: colors.gray[700],
    color: colors.gray[100],
  },
  summaryInputBusy: {
    fontSize: 18,
  },
  // Change Suggestions
  changeSuggestionsContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  changeSuggestionsContainerNight: {
    backgroundColor: `${colors.primary}20`,
  },
  changeSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeSuggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  changeSuggestionsTitleNight: {
    color: colors.primary,
  },
  changeSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  changeSuggestionItem: {
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeSuggestionItemNight: {
    backgroundColor: colors.gray[700],
    color: colors.gray[100],
  },
  customerSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginBottom: 12,
  },
  customerSelectorNight: {
    backgroundColor: colors.gray[700],
  },
  customerSelectorLabel: {
    fontSize: 16,
    color: colors.text,
  },
  customerSelectorLabelNight: {
    color: colors.gray[100],
  },
  customerSelectorLabelBusy: {
    fontSize: 18,
  },
  customerSelectorValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  customerSelectorValueBusy: {
    fontSize: 18,
  },
  dateSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginBottom: 12,
  },
  dateSelectorNight: {
    backgroundColor: colors.gray[700],
  },
  dateSelectorLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  dateSelectorLabelNight: {
    color: colors.gray[100],
  },
  dateSelectorLabelBusy: {
    fontSize: 16,
  },
  dateSelectorValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateSelectorText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  dateSelectorTextBusy: {
    fontSize: 18,
  },
  notesInput: {
    marginBottom: 0,
  },
  inputNight: {
    backgroundColor: colors.gray[700],
    color: colors.gray[100],
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonNight: {
    borderColor: colors.primary,
  },
  cancelButtonBusy: {
    paddingVertical: 18,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonTextNight: {
    color: colors.primary,
  },
  cancelButtonTextBusy: {
    fontSize: 18,
  },
  checkoutButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonBusy: {
    paddingVertical: 18,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutButtonTextBusy: {
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  // QRIS Modal Styles
  qrisModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  qrisModalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  qrisModalContentNight: {
    backgroundColor: colors.gray[800],
  },
  qrisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  qrisHeaderNight: {
    borderBottomColor: colors.gray[700],
  },
  qrisTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  qrisTitleNight: {
    color: colors.gray[100],
  },
  qrisCloseButton: {
    padding: 4,
  },
  qrisBody: {
    padding: 24,
    alignItems: "center",
  },
  qrisAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
  },
  qrisAmountNight: {
    color: colors.gray[100],
  },
  qrisImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  qrisPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginBottom: 24,
  },
  qrisPlaceholderNight: {
    backgroundColor: colors.gray[700],
  },
  qrisPlaceholderText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  qrisPlaceholderTextNight: {
    color: colors.gray[400],
  },
  qrisInstructions: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    marginBottom: 24,
  },
  qrisInstructionsNight: {
    color: colors.gray[400],
  },
  qrisActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  qrisCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qrisCancelButtonNight: {
    borderColor: colors.primary,
  },
  qrisCancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  qrisConfirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrisConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});