import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { ArrowLeft, Printer, Bluetooth, CheckCircle, AlertCircle } from "lucide-react-native";

export default function PrinterSetupScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: "Koneksi Printer",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Printer size={32} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Dukungan Printer Universal</Text>
          <Text style={styles.headerSubtitle}>
            BukaWarung mendukung semua jenis printer thermal Bluetooth yang kompatibel dengan ESC/POS commands
          </Text>
        </View>

        {/* Supported Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Fitur yang Didukung</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.featureText}>Semua printer thermal Bluetooth 58mm & 80mm</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.featureText}>Printer dengan ESC/POS commands</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.featureText}>Auto-detect printer capabilities</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.featureText}>Format struk otomatis sesuai lebar kertas</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.featureText}>Cetak logo, teks, dan barcode</Text>
            </View>
          </View>
        </View>

        {/* Popular Printer Brands */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Brand Printer Populer</Text>
          <Text style={styles.paragraph}>
            Aplikasi ini telah diuji dan bekerja dengan baik pada berbagai brand printer thermal, termasuk:
          </Text>
          <View style={styles.brandGrid}>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>Epson</Text>
              <Text style={styles.brandModel}>TM-T20, TM-T82, TM-T88</Text>
            </View>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>Xprinter</Text>
              <Text style={styles.brandModel}>XP-58, XP-80, XP-365B</Text>
            </View>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>Zjiang</Text>
              <Text style={styles.brandModel}>ZJ-5802, ZJ-8001, ZJ-5890K</Text>
            </View>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>GOOJPRT</Text>
              <Text style={styles.brandModel}>PT-210, PT-200, MTP-II</Text>
            </View>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>Bluetooth POS</Text>
              <Text style={styles.brandModel}>Semua printer generik</Text>
            </View>
            <View style={styles.brandCard}>
              <Text style={styles.brandName}>Dan Lainnya</Text>
              <Text style={styles.brandModel}>Printer ESC/POS compatible</Text>
            </View>
          </View>
        </View>

        {/* Connection Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Cara Menghubungkan Printer</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Nyalakan Printer</Text>
                <Text style={styles.stepDescription}>
                  Pastikan printer dalam keadaan menyala dan mode Bluetooth aktif (biasanya LED biru berkedip)
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Buka Pengaturan Bluetooth</Text>
                <Text style={styles.stepDescription}>
                  Pada perangkat Android/iOS, buka Pengaturan → Bluetooth dan pastikan Bluetooth aktif
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Cari & Pair Printer</Text>
                <Text style={styles.stepDescription}>
                  Cari printer di daftar perangkat tersedia, pilih untuk pairing (PIN biasanya 0000 atau 1234)
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Test Print</Text>
                <Text style={styles.stepDescription}>
                  Kembali ke BukaWarung, buat transaksi dan tekan tombol "Print" untuk test cetak struk
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Troubleshooting</Text>
          
          <View style={styles.troubleshootingCard}>
            <View style={styles.troubleshootingHeader}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={styles.troubleshootingTitle}>Printer tidak terdeteksi</Text>
            </View>
            <View style={styles.troubleshootingSolutions}>
              <Text style={styles.solutionItem}>• Pastikan printer dalam jangkauan Bluetooth (maksimal 10 meter)</Text>
              <Text style={styles.solutionItem}>• Pastikan printer dalam mode pairing (LED berkedip)</Text>
              <Text style={styles.solutionItem}>• Restart printer dan perangkat, coba lagi</Text>
              <Text style={styles.solutionItem}>• Periksa apakah printer sudah terpair dengan perangkat lain</Text>
            </View>
          </View>
          
          <View style={styles.troubleshootingCard}>
            <View style={styles.troubleshootingHeader}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={styles.troubleshootingTitle}>Printer terhubung tapi tidak mencetak</Text>
            </View>
            <View style={styles.troubleshootingSolutions}>
              <Text style={styles.solutionItem}>• Periksa apakah printer memiliki kertas thermal yang cukup</Text>
              <Text style={styles.solutionItem}>• Pastikan baterai printer terisi penuh</Text>
              <Text style={styles.solutionItem}>• Coba unpair dan pair ulang printer di pengaturan Bluetooth</Text>
              <Text style={styles.solutionItem}>• Restart aplikasi BukaWarung</Text>
            </View>
          </View>
          
          <View style={styles.troubleshootingCard}>
            <View style={styles.troubleshootingHeader}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={styles.troubleshootingTitle}>Hasil cetakan tidak jelas atau terpotong</Text>
            </View>
            <View style={styles.troubleshootingSolutions}>
              <Text style={styles.solutionItem}>• Periksa kualitas kertas thermal (gunakan kertas berkualitas baik)</Text>
              <Text style={styles.solutionItem}>• Pastikan printer tidak terlalu panas (biarkan dingin sejenak)</Text>
              <Text style={styles.solutionItem}>• Bersihkan print head dengan alkohol isopropil dan cotton swab</Text>
              <Text style={styles.solutionItem}>• Sesuaikan pengaturan lebar kertas di aplikasi</Text>
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Bantuan & Dukungan</Text>
          <View style={styles.supportCard}>
            <Bluetooth size={24} color={colors.primary} />
            <Text style={styles.supportTitle}>Butuh Bantuan Lebih Lanjut?</Text>
            <Text style={styles.supportDescription}>
              Tim dukungan kami siap membantu Anda menyelesaikan masalah koneksi printer atau masalah lainnya terkait aplikasi BukaWarung.
            </Text>
            <Text style={styles.supportNote}>
              Bergabunglah dengan grup WhatsApp kami melalui tombol "Gabung Grup WhatsApp" di halaman Dashboard untuk mendapatkan bantuan langsung dari tim dan komunitas pengguna BukaWarung.
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  brandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  brandCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  brandModel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  troubleshootingCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  troubleshootingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  troubleshootingSolutions: {
    gap: 8,
  },
  solutionItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  supportCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  supportDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  supportNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  bottomSpacing: {
    height: 32,
  },
});