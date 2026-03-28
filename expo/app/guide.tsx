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
import { ArrowLeft } from "lucide-react-native";

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: "Panduan Penggunaan",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Menambahkan Produk</Text>
          <Text style={styles.paragraph}>
            Untuk menambahkan produk baru ke dalam sistem:
          </Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>1.</Text>
            <Text style={styles.stepText}>Buka menu "Produk" di bagian bawah aplikasi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>2.</Text>
            <Text style={styles.stepText}>Tekan tombol "Tambah" di pojok kanan atas</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>3.</Text>
            <Text style={styles.stepText}>Isi informasi produk seperti nama, harga beli, harga jual, dan kategori</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>4.</Text>
            <Text style={styles.stepText}>Tekan "Simpan" untuk menambahkan produk</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Melakukan Transaksi</Text>
          <Text style={styles.paragraph}>
            Untuk melakukan transaksi penjualan:
          </Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>1.</Text>
            <Text style={styles.stepText}>Buka menu "Kasir" di bagian bawah aplikasi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>2.</Text>
            <Text style={styles.stepText}>Cari produk dengan mengetik nama atau kode produk di kolom pencarian</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>3.</Text>
            <Text style={styles.stepText}>Pilih produk dari hasil pencarian untuk menambahkannya ke keranjang</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>4.</Text>
            <Text style={styles.stepText}>Atur jumlah produk yang dibeli menggunakan tombol + dan -</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>5.</Text>
            <Text style={styles.stepText}>Masukkan diskon jika ada</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>6.</Text>
            <Text style={styles.stepText}>Masukkan jumlah uang yang dibayarkan oleh pelanggan</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>7.</Text>
            <Text style={styles.stepText}>Tekan tombol "Bayar" untuk menyelesaikan transaksi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Melihat Laporan</Text>
          <Text style={styles.paragraph}>
            Untuk melihat laporan penjualan:
          </Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>1.</Text>
            <Text style={styles.stepText}>Buka menu "Laporan" di bagian bawah aplikasi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>2.</Text>
            <Text style={styles.stepText}>Pilih periode laporan (harian, mingguan, atau bulanan)</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>3.</Text>
            <Text style={styles.stepText}>Lihat ringkasan penjualan dan daftar transaksi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>4.</Text>
            <Text style={styles.stepText}>Gunakan tombol "Export Laporan" untuk membagikan laporan</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Pengaturan Toko</Text>
          <Text style={styles.paragraph}>
            Untuk mengatur informasi toko:
          </Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>1.</Text>
            <Text style={styles.stepText}>Buka menu "Pengaturan" di bagian bawah aplikasi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>2.</Text>
            <Text style={styles.stepText}>Isi informasi toko seperti nama, alamat, dan nomor telepon</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>3.</Text>
            <Text style={styles.stepText}>Tekan "Simpan" untuk menyimpan perubahan</Text>
          </View>
          <Text style={styles.note}>
            Informasi ini akan muncul di struk pembayaran yang dicetak atau dibagikan.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Backup dan Restore Data</Text>
          <Text style={styles.paragraph}>
            Untuk melakukan backup dan restore data:
          </Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>1.</Text>
            <Text style={styles.stepText}>Buka menu "Pengaturan" di bagian bawah aplikasi</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>2.</Text>
            <Text style={styles.stepText}>Scroll ke bagian "Backup & Restore"</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>3.</Text>
            <Text style={styles.stepText}>Tekan "Backup Data" untuk membuat backup</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>4.</Text>
            <Text style={styles.stepText}>Tekan "Restore" untuk mengembalikan data dari backup</Text>
          </View>
          <Text style={styles.note}>
            Lakukan backup secara berkala untuk menghindari kehilangan data.
          </Text>
        </View>
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  step: {
    width: 20,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  note: {
    fontSize: 14,
    fontStyle: "italic",
    color: colors.gray[600],
    marginTop: 12,
    lineHeight: 20,
  },
});