import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/dateUtils";
import { ArrowLeft, Printer, Share2, MessageCircle, FileText } from "lucide-react-native";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getTransaction = useTransactionStore((state) => state.getTransaction);
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const receiptTemplate = useSettingsStore((state) => state.receiptTemplate);
  const customReceiptText = useSettingsStore((state) => state.customReceiptText);
  const receiptHeaderImage = useSettingsStore((state) => state.receiptHeaderImage);
  const nightMode = useSettingsStore((state) => state.nightMode);
  
  const transaction = getTransaction(id);

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, nightMode && styles.containerNight]}>
        <Stack.Screen options={{ title: "Detail Transaksi" }} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, nightMode && styles.notFoundTextNight]}>
            Transaksi tidak ditemukan
          </Text>
          <Button
            title="Kembali"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  const getReceiptContent = () => {
    const baseContent = {
      header: `${transaction.storeInfo.name}
${transaction.storeInfo.address || ""}
${transaction.storeInfo.phone ? `Telp: ${transaction.storeInfo.phone}` : ""}`,
      info: `Tanggal: ${formatDateTime(transaction.createdAt)}
Kasir: ${transaction.cashierName}
No: #${transaction.id.slice(-6)}`,
      items: transaction.items
        .map(
          (item) =>
            `${item.name} x${item.quantity} @${formatCurrency(item.sellPrice)} = ${formatCurrency(
              item.subtotal
            )}`
        )
        .join("\n"),
      summary: `Subtotal: ${formatCurrency(transaction.subtotal)}
Diskon: ${formatCurrency(transaction.discount)}
TOTAL: ${formatCurrency(transaction.total)}

Bayar: ${formatCurrency(transaction.amountPaid)}
Kembali: ${formatCurrency(transaction.change)}`,
      footer: transaction.storeInfo.note || "Terima kasih atas kunjungan Anda"
    };

    if (receiptTemplate === 'custom') {
      return customReceiptText
        .replace(/{STORE_NAME}/g, transaction.storeInfo.name)
        .replace(/{STORE_ADDRESS}/g, transaction.storeInfo.address || "")
        .replace(/{STORE_PHONE}/g, transaction.storeInfo.phone || "")
        .replace(/{DATE}/g, formatDateTime(transaction.createdAt))
        .replace(/{CASHIER}/g, transaction.cashierName)
        .replace(/{TRANSACTION_ID}/g, `#${transaction.id.slice(-6)}`)
        .replace(/{ITEMS}/g, baseContent.items)
        .replace(/{TOTAL}/g, formatCurrency(transaction.total))
        .replace(/{PAID}/g, formatCurrency(transaction.amountPaid))
        .replace(/{CHANGE}/g, formatCurrency(transaction.change));
    }

    switch (receiptTemplate) {
      case 'cute':
        return `🌟 ${baseContent.header} 🌟

📅 ${baseContent.info}

🛒 PEMBELIAN:
${baseContent.items}

💰 ${baseContent.summary}

😊 ${baseContent.footer} 😊`;
      
      case 'modern':
        return `${baseContent.header}

${baseContent.info}

--- ITEMS ---
${baseContent.items}

--- SUMMARY ---
${baseContent.summary}

${baseContent.footer}`;
      
      case 'professional':
        return `${baseContent.header.toUpperCase()}

TRANSACTION DETAILS:
${baseContent.info}

ITEMS PURCHASED:
${baseContent.items}

PAYMENT SUMMARY:
${baseContent.summary}

${baseContent.footer}`;
      
      case 'promo':
        return `${baseContent.header}

${baseContent.info}

${baseContent.items}

${baseContent.summary}

🎉 PROMO SPESIAL! 🎉
Beli 2 Gratis 1 untuk produk tertentu!
Kunjungi kami lagi!

${baseContent.footer}`;
      
      default: // classic
        return `${baseContent.header}

${baseContent.info}

${baseContent.items}

${baseContent.summary}

${baseContent.footer}`;
    }
  };

  const handlePrint = () => {
    // In a real app, this would connect to a thermal printer
    Alert.alert(
      "Koneksi Printer",
      "Untuk menghubungkan printer thermal:\n\n1. Pastikan printer menyala dan mode Bluetooth aktif\n2. Pair printer di pengaturan Bluetooth perangkat\n3. Kembali ke aplikasi dan coba cetak lagi",
      [
        { text: "Batal" },
        { 
          text: "Lihat Panduan", 
          onPress: () => {
            // Navigate to printer setup guide
            router.push("/printer-setup");
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      const receiptText = getReceiptContent();

      await Share.share({
        message: receiptText,
        title: "Struk Pembayaran",
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Gagal membagikan struk");
    }
  };

  const handleShareToWhatsApp = async () => {
    try {
      const receiptText = getReceiptContent();
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
      
      await Linking.openURL(whatsappUrl);
    } catch (error) {
      console.error("Error sharing to WhatsApp:", error);
      Alert.alert("Error", "Gagal membuka WhatsApp");
    }
  };

  const handleSaveToPDF = () => {
    // In a real app, this would generate and save a PDF
    Alert.alert(
      "Simpan PDF",
      "Fitur simpan PDF akan tersedia di versi lengkap aplikasi",
      [{ text: "OK" }]
    );
  };

  const getTemplateStyle = () => {
    switch (receiptTemplate) {
      case 'cute':
        return styles.cuteTemplate;
      case 'modern':
        return styles.modernTemplate;
      case 'professional':
        return styles.professionalTemplate;
      case 'promo':
        return styles.promoTemplate;
      case 'custom':
        return styles.customTemplate;
      default:
        return styles.classicTemplate;
    }
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  const receiptCardStyle = [
    styles.receiptCard,
    nightMode && styles.receiptCardNight,
    getTemplateStyle()
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: `Transaksi #${transaction.id.slice(-6)}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={nightMode ? colors.gray[100] : colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={[styles.scrollView, nightMode && styles.scrollViewNight]}>
        <Card style={receiptCardStyle}>
          {/* Custom Header Image */}
          {receiptTemplate === 'custom' && receiptHeaderImage && (
            <Image source={{ uri: receiptHeaderImage }} style={styles.customHeaderImage} />
          )}

          <View style={styles.receiptHeader}>
            {storeInfo.logo && (
              <Image source={{ uri: storeInfo.logo }} style={styles.storeLogo} />
            )}
            <Text style={[styles.storeName, nightMode && styles.storeNameNight]}>
              {transaction.storeInfo.name}
            </Text>
            {transaction.storeInfo.address && (
              <Text style={[styles.storeInfo, nightMode && styles.storeInfoNight]}>
                {transaction.storeInfo.address}
              </Text>
            )}
            {transaction.storeInfo.phone && (
              <Text style={[styles.storeInfo, nightMode && styles.storeInfoNight]}>
                Telp: {transaction.storeInfo.phone}
              </Text>
            )}
          </View>

          <View style={styles.receiptInfo}>
            <Text style={[styles.receiptInfoText, nightMode && styles.receiptInfoTextNight]}>
              Tanggal: {formatDateTime(transaction.createdAt)}
            </Text>
            <Text style={[styles.receiptInfoText, nightMode && styles.receiptInfoTextNight]}>
              Kasir: {transaction.cashierName}
            </Text>
            <Text style={[styles.receiptInfoText, nightMode && styles.receiptInfoTextNight]}>
              No: #{transaction.id.slice(-6)}
            </Text>
          </View>

          <View style={[styles.divider, nightMode && styles.dividerNight]} />

          <View style={styles.itemsContainer}>
            {transaction.items.map((item, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, nightMode && styles.itemNameNight]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemDetail, nightMode && styles.itemDetailNight]}>
                    {item.quantity} x {formatCurrency(item.sellPrice)}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, nightMode && styles.itemTotalNight]}>
                  {formatCurrency(item.subtotal)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, nightMode && styles.dividerNight]} />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, nightMode && styles.summaryLabelNight]}>Subtotal</Text>
              <Text style={[styles.summaryValue, nightMode && styles.summaryValueNight]}>
                {formatCurrency(transaction.subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, nightMode && styles.summaryLabelNight]}>Diskon</Text>
              <Text style={[styles.summaryValue, nightMode && styles.summaryValueNight]}>
                {formatCurrency(transaction.discount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, nightMode && styles.totalLabelNight]}>TOTAL</Text>
              <Text style={[styles.totalValue, nightMode && styles.totalValueNight]}>
                {formatCurrency(transaction.total)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, nightMode && styles.dividerNight]} />

          <View style={styles.paymentContainer}>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, nightMode && styles.paymentLabelNight]}>Bayar</Text>
              <Text style={[styles.paymentValue, nightMode && styles.paymentValueNight]}>
                {formatCurrency(transaction.amountPaid)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, nightMode && styles.paymentLabelNight]}>Kembali</Text>
              <Text style={[styles.paymentValue, nightMode && styles.paymentValueNight]}>
                {formatCurrency(transaction.change)}
              </Text>
            </View>
          </View>

          {receiptTemplate === 'promo' && (
            <View style={styles.promoSection}>
              <Text style={styles.promoTitle}>🎉 PROMO SPESIAL! 🎉</Text>
              <Text style={styles.promoText}>Beli 2 Gratis 1 untuk produk tertentu!</Text>
              <Text style={styles.promoText}>Kunjungi kami lagi!</Text>
            </View>
          )}

          {transaction.storeInfo.note && (
            <Text style={[styles.note, nightMode && styles.noteNight]}>
              {transaction.storeInfo.note}
            </Text>
          )}
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            title="Print"
            onPress={handlePrint}
            variant="outline"
            style={styles.actionButton}
            leftElement={<Printer size={16} color={colors.primary} />}
          />
          <Button
            title="Bagikan"
            onPress={handleShare}
            variant="outline"
            style={styles.actionButton}
            leftElement={<Share2 size={16} color={colors.primary} />}
          />
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Kirim ke WA"
            onPress={handleShareToWhatsApp}
            variant="outline"
            style={styles.actionButton}
            leftElement={<MessageCircle size={16} color={colors.primary} />}
          />
          <Button
            title="Simpan PDF"
            onPress={handleSaveToPDF}
            variant="outline"
            style={styles.actionButton}
            leftElement={<FileText size={16} color={colors.primary} />}
          />
        </View>
      </ScrollView>
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
  backButton: {
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  scrollViewNight: {
    backgroundColor: colors.gray[900],
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 16,
  },
  notFoundTextNight: {
    color: colors.gray[400],
  },
  receiptCard: {
    marginBottom: 16,
  },
  receiptCardNight: {
    backgroundColor: colors.gray[800],
  },
  // Template Styles
  classicTemplate: {
    backgroundColor: colors.background,
  },
  cuteTemplate: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  modernTemplate: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  professionalTemplate: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  promoTemplate: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  customTemplate: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  customHeaderImage: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  storeNameNight: {
    color: colors.gray[100],
  },
  storeInfo: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  storeInfoNight: {
    color: colors.gray[400],
  },
  receiptInfo: {
    marginBottom: 16,
  },
  receiptInfoText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  receiptInfoTextNight: {
    color: colors.gray[100],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[300],
    marginVertical: 16,
  },
  dividerNight: {
    backgroundColor: colors.gray[600],
  },
  itemsContainer: {
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  itemNameNight: {
    color: colors.gray[100],
  },
  itemDetail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  itemDetailNight: {
    color: colors.gray[400],
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  itemTotalNight: {
    color: colors.gray[100],
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  summaryLabelNight: {
    color: colors.gray[400],
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
  },
  summaryValueNight: {
    color: colors.gray[100],
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  totalLabelNight: {
    color: colors.gray[100],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  totalValueNight: {
    color: colors.gray[100],
  },
  paymentContainer: {
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  paymentLabelNight: {
    color: colors.gray[400],
  },
  paymentValue: {
    fontSize: 14,
    color: colors.text,
  },
  paymentValueNight: {
    color: colors.gray[100],
  },
  promoSection: {
    backgroundColor: '#FFE0B2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  promoText: {
    fontSize: 14,
    color: '#BF360C',
    textAlign: 'center',
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  noteNight: {
    color: colors.gray[400],
  },
  actionsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});