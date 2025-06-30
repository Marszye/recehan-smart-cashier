import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Dimensions,
  Switch,
  Modal,
  TextInput,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "@/constants/colors";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useSettingsStore } from "@/store/useSettingsStore";
import { createBackup } from "@/utils/backupUtils";
import { formatDateTime } from "@/utils/dateUtils";
import * as ImagePicker from "expo-image-picker";
import { 
  ChevronRight, 
  Save, 
  Upload, 
  User, 
  Users,
  Camera,
  Image as ImageIcon,
  Moon,
  Sun,
  Zap,
  Battery,
  Volume,
  VolumeX,
  Palette,
  Shield,
  Printer,
  Edit3,
  X,
  RefreshCw,
  Copy,
  Download,
  RotateCcw,
  Settings,
  Cloud,
  Smartphone,
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const storeInfo = useSettingsStore((state) => state.storeInfo);
  const updateStoreInfo = useSettingsStore((state) => state.updateStoreInfo);
  const lastBackup = useSettingsStore((state) => state.lastBackup);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);
  const silentMode = useSettingsStore((state) => state.silentMode);
  const batterySaverMode = useSettingsStore((state) => state.batterySaverMode);
  const receiptTemplate = useSettingsStore((state) => state.receiptTemplate);
  const customReceiptText = useSettingsStore((state) => state.customReceiptText);
  const receiptHeaderImage = useSettingsStore((state) => state.receiptHeaderImage);
  const syncId = useSettingsStore((state) => state.syncId);
  const toggleNightMode = useSettingsStore((state) => state.toggleNightMode);
  const toggleBusyMode = useSettingsStore((state) => state.toggleBusyMode);
  const toggleSilentMode = useSettingsStore((state) => state.toggleSilentMode);
  const toggleBatterySaverMode = useSettingsStore((state) => state.toggleBatterySaverMode);
  const setReceiptTemplate = useSettingsStore((state) => state.setReceiptTemplate);
  const setCustomReceiptText = useSettingsStore((state) => state.setCustomReceiptText);
  const setReceiptHeaderImage = useSettingsStore((state) => state.setReceiptHeaderImage);
  const generateSyncId = useSettingsStore((state) => state.generateSyncId);
  const uploadToCloud = useSettingsStore((state) => state.uploadToCloud);
  const downloadFromCloud = useSettingsStore((state) => state.downloadFromCloud);

  const [adminName, setAdminName] = useState(storeInfo.adminName || "Admin");
  const [storeName, setStoreName] = useState(storeInfo.name);
  const [storeAddress, setStoreAddress] = useState(storeInfo.address || "");
  const [storePhone, setStorePhone] = useState(storeInfo.phone || "");
  const [storeNote, setStoreNote] = useState(storeInfo.note || "");
  const [qrisImage, setQrisImage] = useState(storeInfo.qrisImage || "");
  const [storeLogo, setStoreLogo] = useState(storeInfo.logo || "");
  
  // Custom receipt modal states
  const [showCustomReceiptModal, setShowCustomReceiptModal] = useState(false);
  const [tempCustomText, setTempCustomText] = useState(customReceiptText);

  // Sync modal states
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncInputId, setSyncInputId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptTemplates = [
    { id: 'classic', name: 'Klasik', description: 'Template standar warung' },
    { id: 'modern', name: 'Modern', description: 'Desain minimalis dan bersih' },
    { id: 'cute', name: 'Lucu', description: 'Dengan emoji dan warna ceria' },
    { id: 'professional', name: 'Profesional', description: 'Formal untuk bisnis' },
    { id: 'promo', name: 'Promo', description: 'Dengan space untuk promosi' },
    { id: 'custom', name: 'Kustom', description: 'Buat template sendiri' },
  ];

  const handleSaveStoreInfo = () => {
    updateStoreInfo({
      adminName,
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      note: storeNote,
      qrisImage,
      logo: storeLogo,
    });
    
    Alert.alert("✅ Sukses", "Informasi toko berhasil disimpan");
  };

  const handlePickQRISImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('❌ Error', 'Izin akses galeri diperlukan untuk memilih gambar QRIS');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setQrisImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('❌ Error', 'Gagal memilih gambar');
    }
  };

  const handlePickStoreLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('❌ Error', 'Izin akses galeri diperlukan untuk memilih logo');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setStoreLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('❌ Error', 'Gagal memilih logo');
    }
  };

  const handlePickReceiptHeaderImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('❌ Error', 'Izin akses galeri diperlukan untuk memilih gambar header');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptHeaderImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking header image:', error);
      Alert.alert('❌ Error', 'Gagal memilih gambar header');
    }
  };

  const handleTakeQRISPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('❌ Error', 'Izin akses kamera diperlukan untuk mengambil foto QRIS');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setQrisImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('❌ Error', 'Gagal mengambil foto');
    }
  };

  const showQRISOptions = () => {
    Alert.alert(
      "📱 Upload QRIS",
      "Pilih cara untuk menambahkan gambar QRIS",
      [
        { text: "Batal" },
        { text: "📷 Ambil Foto", onPress: handleTakeQRISPhoto },
        { text: "🖼️ Pilih dari Galeri", onPress: handlePickQRISImage },
      ]
    );
  };

  const showLogoOptions = () => {
    Alert.alert(
      "🎨 Upload Logo Toko",
      "Pilih cara untuk menambahkan logo toko",
      [
        { text: "Batal" },
        { text: "🖼️ Pilih dari Galeri", onPress: handlePickStoreLogo },
      ]
    );
  };

  const handleBackup = async () => {
    try {
      const result = await createBackup();
      if (result) {
        Alert.alert("✅ Sukses", "Backup berhasil dibuat");
      } else {
        Alert.alert("❌ Error", "Gagal membuat backup");
      }
    } catch (error) {
      console.error("Backup error:", error);
      Alert.alert("❌ Error", "Terjadi kesalahan saat membuat backup");
    }
  };

  const handleRestore = async () => {
    try {
      if (Platform.OS === "web") {
        Alert.alert(
          "🔄 Restore from Backup",
          "On web, you would upload a backup file here."
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        Alert.alert("✅ Sukses", "File dipilih, proses restore akan dimulai");
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("❌ Error", "Terjadi kesalahan saat memilih file");
    }
  };

  const handlePrinterSetup = () => {
    router.push("/printer-setup");
  };

  const handleTemplateSelect = (templateId: string) => {
    setReceiptTemplate(templateId);
    if (templateId === 'custom') {
      setShowCustomReceiptModal(true);
    }
  };

  const handleSaveCustomReceipt = () => {
    setCustomReceiptText(tempCustomText);
    setShowCustomReceiptModal(false);
    Alert.alert("✅ Sukses", "Template kustom berhasil disimpan");
  };

  // Fixed clipboard function that works in restricted web environments
  const handleCopySyncId = () => {
    if (!syncId) return;
    
    if (Platform.OS === 'web') {
      try {
        // Try the modern clipboard API first
        navigator.clipboard.writeText(syncId)
          .then(() => {
            Alert.alert("✅ Sukses", "ID Sinkronisasi berhasil disalin");
          })
          .catch(() => {
            // Fallback method using a temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = syncId;
            textArea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
              const successful = document.execCommand('copy');
              if (successful) {
                Alert.alert("✅ Sukses", "ID Sinkronisasi berhasil disalin");
              } else {
                Alert.alert("❌ Error", "Gagal menyalin ID Sinkronisasi");
              }
            } catch (err) {
              Alert.alert("❌ Error", "Gagal menyalin ID Sinkronisasi");
            }
            
            document.body.removeChild(textArea);
          });
      } catch (error) {
        Alert.alert("❌ Error", "Gagal menyalin ID Sinkronisasi");
      }
    } else {
      Clipboard.setString(syncId);
      Alert.alert("✅ Sukses", "ID Sinkronisasi berhasil disalin");
    }
  };

  const handleGenerateSyncId = () => {
    generateSyncId();
    Alert.alert("✅ Sukses", "ID Sinkronisasi baru berhasil dibuat");
  };

  const handleUploadToCloud = async () => {
    if (!syncId) {
      Alert.alert("⚠️ Peringatan", "Harap buat ID Sinkronisasi terlebih dahulu");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadToCloud();
      if (result.success) {
        Alert.alert("✅ Sukses", result.message);
      } else {
        Alert.alert("❌ Error", result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("❌ Error", "Terjadi kesalahan saat mengupload data");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!syncInputId.trim()) {
      Alert.alert("⚠️ Peringatan", "Masukkan ID Sinkronisasi yang valid");
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadFromCloud(syncInputId.trim());
      if (result.success) {
        Alert.alert("✅ Sukses", result.message, [
          { text: "OK", onPress: () => setShowSyncModal(false) }
        ]);
      } else {
        Alert.alert("❌ Error", result.message);
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("❌ Error", "Terjadi kesalahan saat mengunduh data");
    } finally {
      setIsDownloading(false);
    }
  };

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  const scrollViewStyle = [
    styles.scrollView,
    nightMode && styles.scrollViewNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      {/* Header */}
      <View style={[styles.header, nightMode && styles.headerNight]}>
        <Text style={[styles.headerTitle, nightMode && styles.headerTitleNight]}>
          ⚙️ Pengaturan
        </Text>
        <Text style={[styles.headerSubtitle, nightMode && styles.headerSubtitleNight]}>
          Kustomisasi aplikasi sesuai kebutuhan
        </Text>
      </View>

      <ScrollView style={scrollViewStyle} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.profileImage, nightMode && styles.profileImageNight]}>
              <User size={40} color={nightMode ? colors.gray[400] : colors.gray[500]} />
            </View>
          </View>
          <Text style={[styles.profileName, nightMode && styles.profileNameNight]}>{adminName}</Text>
          <Text style={[styles.profileRole, nightMode && styles.profileRoleNight]}>Pemilik Toko</Text>
        </View>

        {/* App Modes */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🎛️ Mode Aplikasi</Text>
          
          <View style={[styles.settingItem, nightMode && styles.settingItemNight]}>
            <View style={styles.settingInfo}>
              {nightMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, nightMode && styles.settingLabelNight]}>Mode Malam</Text>
                <Text style={[styles.settingDescription, nightMode && styles.settingDescriptionNight]}>
                  Tampilan gelap untuk mata yang nyaman
                </Text>
              </View>
            </View>
            <Switch
              value={nightMode}
              onValueChange={toggleNightMode}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={nightMode ? '#FFFFFF' : colors.gray[100]}
            />
          </View>

          <View style={[styles.settingItem, nightMode && styles.settingItemNight]}>
            <View style={styles.settingInfo}>
              <Zap size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, nightMode && styles.settingLabelNight]}>Mode Ramai</Text>
                <Text style={[styles.settingDescription, nightMode && styles.settingDescriptionNight]}>
                  Tombol dan font diperbesar untuk warung ramai
                </Text>
              </View>
            </View>
            <Switch
              value={busyMode}
              onValueChange={toggleBusyMode}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={busyMode ? '#FFFFFF' : colors.gray[100]}
            />
          </View>

          <View style={[styles.settingItem, nightMode && styles.settingItemNight]}>
            <View style={styles.settingInfo}>
              {silentMode ? <VolumeX size={20} color={colors.primary} /> : <Volume size={20} color={colors.primary} />}
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, nightMode && styles.settingLabelNight]}>Mode Senyap</Text>
                <Text style={[styles.settingDescription, nightMode && styles.settingDescriptionNight]}>
                  Matikan semua suara dan getaran
                </Text>
              </View>
            </View>
            <Switch
              value={silentMode}
              onValueChange={toggleSilentMode}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={silentMode ? '#FFFFFF' : colors.gray[100]}
            />
          </View>

          <View style={[styles.settingItem, nightMode && styles.settingItemNight]}>
            <View style={styles.settingInfo}>
              <Battery size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, nightMode && styles.settingLabelNight]}>Mode Hemat Baterai</Text>
                <Text style={[styles.settingDescription, nightMode && styles.settingDescriptionNight]}>
                  Kurangi animasi dan efek visual
                </Text>
              </View>
            </View>
            <Switch
              value={batterySaverMode}
              onValueChange={toggleBatterySaverMode}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={batterySaverMode ? '#FFFFFF' : colors.gray[100]}
            />
          </View>
        </Card>

        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>👤 Informasi Admin</Text>
          <Input
            label="Nama Admin"
            value={adminName}
            onChangeText={setAdminName}
            placeholder="Masukkan nama admin"
            style={nightMode && styles.inputNight}
          />
        </Card>

        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🏪 Informasi Toko</Text>
          <Input
            label="Nama Toko"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Masukkan nama toko"
            style={nightMode && styles.inputNight}
          />
          <Input
            label="Alamat"
            value={storeAddress}
            onChangeText={setStoreAddress}
            placeholder="Masukkan alamat toko"
            style={nightMode && styles.inputNight}
          />
          <Input
            label="Nomor Telepon (+628XXXX)"
            value={storePhone}
            onChangeText={setStorePhone}
            placeholder="Masukkan nomor telepon"
            keyboardType="phone-pad"
            style={nightMode && styles.inputNight}
          />
          <Input
            label="Catatan Struk (Opsional)"
            value={storeNote}
            onChangeText={setStoreNote}
            placeholder="Masukkan catatan untuk struk"
            multiline
            numberOfLines={3}
            style={nightMode && styles.inputNight}
          />
        </Card>

        {/* Store Logo */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🎨 Logo Toko</Text>
          <Text style={[styles.logoDescription, nightMode && styles.logoDescriptionNight]}>
            Upload logo toko untuk ditampilkan di struk pembayaran
          </Text>
          
          {storeLogo ? (
            <View style={styles.logoPreviewContainer}>
              <Image source={{ uri: storeLogo }} style={styles.logoPreview} />
              <TouchableOpacity
                style={styles.changeLogoButton}
                onPress={showLogoOptions}
              >
                <Text style={styles.changeLogoText}>Ganti Logo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadLogoButton, nightMode && styles.uploadLogoButtonNight]}
              onPress={showLogoOptions}
            >
              <ImageIcon size={24} color={colors.primary} />
              <Text style={styles.uploadLogoText}>Upload Logo</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Receipt Templates */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🧾 Template Struk</Text>
          <Text style={[styles.templateDescription, nightMode && styles.templateDescriptionNight]}>
            Pilih desain struk yang sesuai dengan karakter toko Anda
          </Text>
          
          <View style={styles.templatesContainer}>
            {receiptTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateItem,
                  nightMode && styles.templateItemNight,
                  receiptTemplate === template.id && styles.selectedTemplate
                ]}
                onPress={() => handleTemplateSelect(template.id)}
              >
                <View style={styles.templateInfo}>
                  <View style={styles.templateHeader}>
                    <Text style={[
                      styles.templateName,
                      nightMode && styles.templateNameNight,
                      receiptTemplate === template.id && styles.selectedTemplateName
                    ]}>
                      {template.name}
                    </Text>
                    {template.id === 'custom' && (
                      <TouchableOpacity
                        onPress={() => setShowCustomReceiptModal(true)}
                        style={styles.editButton}
                      >
                        <Edit3 size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[
                    styles.templateDescription,
                    nightMode && styles.templateDescriptionNight,
                    receiptTemplate === template.id && styles.selectedTemplateDescription
                  ]}>
                    {template.description}
                  </Text>
                </View>
                {receiptTemplate === template.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Receipt Header Image for Custom Template */}
          {receiptTemplate === 'custom' && (
            <View style={styles.customReceiptSection}>
              <Text style={[styles.customSectionTitle, nightMode && styles.customSectionTitleNight]}>
                Gambar Header (Opsional)
              </Text>
              {receiptHeaderImage ? (
                <View style={styles.headerImageContainer}>
                  <Image source={{ uri: receiptHeaderImage }} style={styles.headerImagePreview} />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handlePickReceiptHeaderImage}
                  >
                    <Text style={styles.changeImageText}>Ganti Gambar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadHeaderButton, nightMode && styles.uploadHeaderButtonNight]}
                  onPress={handlePickReceiptHeaderImage}
                >
                  <ImageIcon size={20} color={colors.primary} />
                  <Text style={styles.uploadHeaderText}>Upload Gambar Header</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>💳 QRIS Payment</Text>
          <Text style={[styles.qrisDescription, nightMode && styles.qrisDescriptionNight]}>
            Upload gambar QRIS untuk menerima pembayaran digital
          </Text>
          
          {qrisImage ? (
            <View style={styles.qrisPreviewContainer}>
              <Image source={{ uri: qrisImage }} style={styles.qrisPreview} />
              <TouchableOpacity
                style={styles.changeQrisButton}
                onPress={showQRISOptions}
              >
                <Text style={styles.changeQrisText}>Ganti QRIS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadQrisButton, nightMode && styles.uploadQrisButtonNight]}
              onPress={showQRISOptions}
            >
              <ImageIcon size={24} color={colors.primary} />
              <Text style={styles.uploadQrisText}>Upload QRIS</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveStoreInfo}
          >
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Simpan Semua Pengaturan</Text>
          </TouchableOpacity>
        </Card>

        {/* Synchronization */}
        <Card variant="luxury" style={[nightMode && styles.cardNight, styles.syncCard]}>
          <View style={styles.syncHeader}>
            <Cloud size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight, styles.syncTitle]}>
              🔄 Sinkronisasi Multi Device
            </Text>
          </View>
          <Text style={[styles.syncDescription, nightMode && styles.syncDescriptionNight]}>
            Sinkronkan data Anda ke semua perangkat dengan mudah dan aman
          </Text>
          
          {/* Sync ID Display */}
          <View style={[styles.syncIdContainer, nightMode && styles.syncIdContainerNight]}>
            <View style={styles.syncIdHeader}>
              <Smartphone size={18} color={colors.primary} />
              <Text style={[styles.syncIdLabel, nightMode && styles.syncIdLabelNight]}>ID Sinkronisasi Anda</Text>
            </View>
            {syncId ? (
              <View style={styles.syncIdRow}>
                <View style={[styles.syncIdBox, nightMode && styles.syncIdBoxNight]}>
                  <Text style={[styles.syncIdText, nightMode && styles.syncIdTextNight]}>{syncId}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopySyncId}
                >
                  <Copy size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.noSyncIdBox, nightMode && styles.noSyncIdBoxNight]}>
                <Text style={[styles.noSyncIdText, nightMode && styles.noSyncIdTextNight]}>
                  Belum ada ID Sinkronisasi
                </Text>
              </View>
            )}
          </View>

          <View style={styles.syncActions}>
            {!syncId && (
              <TouchableOpacity
                style={[styles.syncButton, styles.generateButton]}
                onPress={handleGenerateSyncId}
              >
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Buat ID Sinkronisasi</Text>
              </TouchableOpacity>
            )}
            
            {syncId && (
              <TouchableOpacity
                style={[styles.syncButton, styles.uploadButton]}
                onPress={handleUploadToCloud}
                disabled={isUploading}
              >
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>
                  {isUploading ? "Mengupload..." : "Upload ke Cloud"}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.syncButton, styles.downloadButton]}
              onPress={() => setShowSyncModal(true)}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Sinkronisasi dari Device Lain</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Hardware Setup */}
        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🖨️ Pengaturan Hardware</Text>
          <TouchableOpacity 
            style={[styles.menuItem, nightMode && styles.menuItemNight]}
            onPress={handlePrinterSetup}
          >
            <View style={styles.menuItemContent}>
              <Printer size={20} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={[styles.menuItemText, nightMode && styles.menuItemTextNight]}>Setup Printer Thermal</Text>
            </View>
            <ChevronRight size={20} color={nightMode ? colors.gray[400] : colors.gray[500]} />
          </TouchableOpacity>
        </Card>

        <Card variant="luxury" style={nightMode && styles.cardNight}>
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>💾 Backup & Restore</Text>
          <View style={styles.backupInfo}>
            <Text style={[styles.backupLabel, nightMode && styles.backupLabelNight]}>Backup Terakhir</Text>
            <Text style={[styles.backupDate, nightMode && styles.backupDateNight]}>
              {lastBackup
                ? formatDateTime(lastBackup)
                : "Belum pernah backup"}
            </Text>
          </View>
          <View style={styles.backupActions}>
            <TouchableOpacity
              style={[styles.backupButton, nightMode && styles.backupButtonNight]}
              onPress={handleBackup}
            >
              <Text style={styles.backupButtonText}>Backup Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.restoreButton, nightMode && styles.restoreButtonNight]}
              onPress={handleRestore}
            >
              <Upload size={16} color={colors.primary} />
              <Text style={styles.restoreButtonText}>Restore</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Custom Receipt Modal */}
      <Modal
        visible={showCustomReceiptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomReceiptModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Edit Template Kustom</Text>
              <TouchableOpacity
                onPress={() => setShowCustomReceiptModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, nightMode && styles.modalDescriptionNight]}>
                Buat template struk sesuai keinginan Anda. Gunakan variabel berikut:
              </Text>
              <Text style={[styles.variableList, nightMode && styles.variableListNight]}>
                {"{STORE_NAME}"} - Nama toko{"\n"}
                {"{STORE_ADDRESS}"} - Alamat toko{"\n"}
                {"{STORE_PHONE}"} - Telepon toko{"\n"}
                {"{DATE}"} - Tanggal transaksi{"\n"}
                {"{CASHIER}"} - Nama kasir{"\n"}
                {"{TRANSACTION_ID}"} - ID transaksi{"\n"}
                {"{ITEMS}"} - Daftar item{"\n"}
                {"{TOTAL}"} - Total pembayaran{"\n"}
                {"{PAID}"} - Jumlah dibayar{"\n"}
                {"{CHANGE}"} - Kembalian
              </Text>
              
              <TextInput
                style={[
                  styles.customTextInput,
                  nightMode && styles.customTextInputNight
                ]}
                value={tempCustomText}
                onChangeText={setTempCustomText}
                placeholder="Masukkan template struk kustom..."
                placeholderTextColor={nightMode ? colors.gray[500] : colors.gray[400]}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, nightMode && styles.modalCancelButtonNight]}
                  onPress={() => setShowCustomReceiptModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveCustomReceipt}
                >
                  <Text style={styles.modalSaveButtonText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Modal */}
      <Modal
        visible={showSyncModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSyncModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={[styles.modalHeader, nightMode && styles.modalHeaderNight]}>
              <View style={styles.modalTitleContainer}>
                <Cloud size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Sinkronisasi Data</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSyncModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={nightMode ? colors.gray[300] : colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, nightMode && styles.modalDescriptionNight]}>
                Masukkan ID Sinkronisasi dari device lain untuk mengunduh data:
              </Text>
              
              <TextInput
                style={[
                  styles.syncInput,
                  nightMode && styles.syncInputNight
                ]}
                value={syncInputId}
                onChangeText={setSyncInputId}
                placeholder="Masukkan ID Sinkronisasi..."
                placeholderTextColor={nightMode ? colors.gray[500] : colors.gray[400]}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, nightMode && styles.modalCancelButtonNight]}
                  onPress={() => setShowSyncModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!syncInputId.trim() || isDownloading) && styles.modalSaveButtonDisabled
                  ]}
                  onPress={handleDownloadFromCloud}
                  disabled={isDownloading || !syncInputId.trim()}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {isDownloading ? "Mengunduh..." : "Sinkronisasi"}
                  </Text>
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
    padding: 20,
    paddingTop: 40,
  },
  headerNight: {
    backgroundColor: colors.gray[900],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  headerTitleNight: {
    color: colors.gray[100],
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerSubtitleNight: {
    color: colors.gray[400],
  },
  scrollView: {
    flex: 1,
  },
  scrollViewNight: {
    backgroundColor: colors.gray[900],
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  cardNight: {
    backgroundColor: colors.gray[800],
    borderWidth: 0,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageNight: {
    backgroundColor: colors.gray[700],
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  profileNameNight: {
    color: colors.night.text,
  },
  profileRole: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 12,
  },
  profileRoleNight: {
    color: colors.gray[400],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitleNight: {
    color: colors.night.text,
  },
  // Settings Items
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingItemNight: {
    borderBottomColor: colors.gray[700],
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingLabelNight: {
    color: colors.night.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  settingDescriptionNight: {
    color: colors.gray[400],
  },
  inputNight: {
    backgroundColor: colors.gray[700],
    color: colors.night.text,
    borderColor: colors.gray[600],
  },
  // Logo Styles
  logoDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  logoDescriptionNight: {
    color: colors.gray[400],
  },
  logoPreviewContainer: {
    alignItems: "center",
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  changeLogoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  changeLogoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadLogoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  uploadLogoButtonNight: {
    backgroundColor: `${colors.primary}25`,
  },
  uploadLogoText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 8,
  },
  // Template Styles
  templateDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  templateDescriptionNight: {
    color: colors.gray[400],
  },
  templatesContainer: {
    gap: 8,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateItemNight: {
    backgroundColor: colors.gray[700],
  },
  selectedTemplate: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  templateInfo: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  templateNameNight: {
    color: colors.night.text,
  },
  selectedTemplateName: {
    color: colors.primary,
  },
  selectedTemplateDescription: {
    color: colors.primary,
  },
  editButton: {
    padding: 4,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Custom Receipt Section
  customReceiptSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  customSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  customSectionTitleNight: {
    color: colors.night.text,
  },
  headerImageContainer: {
    alignItems: 'center',
  },
  headerImagePreview: {
    width: 200,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  uploadHeaderButtonNight: {
    backgroundColor: `${colors.primary}20`,
  },
  uploadHeaderText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  qrisDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  qrisDescriptionNight: {
    color: colors.gray[400],
  },
  qrisPreviewContainer: {
    alignItems: "center",
  },
  qrisPreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  changeQrisButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  changeQrisText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadQrisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  uploadQrisButtonNight: {
    backgroundColor: `${colors.primary}25`,
  },
  uploadQrisText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Enhanced Sync Styles
  syncCard: {
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncTitle: {
    marginLeft: 8,
    marginBottom: 0,
  },
  syncDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 20,
    lineHeight: 20,
  },
  syncDescriptionNight: {
    color: colors.gray[400],
  },
  syncIdContainer: {
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  syncIdContainerNight: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
  },
  syncIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncIdLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
    marginLeft: 8,
  },
  syncIdLabelNight: {
    color: colors.gray[300],
  },
  syncIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIdBox: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  syncIdBoxNight: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[600],
  },
  syncIdText: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  syncIdTextNight: {
    color: colors.night.text,
  },
  copyButton: {
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noSyncIdBox: {
    backgroundColor: colors.gray[100],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noSyncIdBoxNight: {
    backgroundColor: colors.gray[600],
  },
  noSyncIdText: {
    fontSize: 14,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  noSyncIdTextNight: {
    color: colors.gray[300],
  },
  syncActions: {
    gap: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButton: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  uploadButton: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  downloadButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemNight: {
    borderBottomColor: colors.gray[700],
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemTextNight: {
    color: colors.night.text,
  },
  backupInfo: {
    marginBottom: 16,
  },
  backupLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  backupLabelNight: {
    color: colors.gray[400],
  },
  backupDate: {
    fontSize: 16,
    color: colors.text,
  },
  backupDateNight: {
    color: colors.night.text,
  },
  backupActions: {
    flexDirection: "row",
    gap: 12,
  },
  backupButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  backupButtonNight: {
    borderColor: colors.primary,
  },
  backupButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  restoreButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  restoreButtonNight: {
    borderColor: colors.primary,
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: screenWidth * 0.9,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
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
  modalDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 12,
  },
  modalDescriptionNight: {
    color: colors.gray[400],
  },
  variableList: {
    fontSize: 12,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  variableListNight: {
    color: colors.gray[400],
    backgroundColor: colors.gray[700],
  },
  customTextInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 120,
    marginBottom: 16,
  },
  customTextInputNight: {
    borderColor: colors.gray[600],
    backgroundColor: colors.gray[700],
    color: colors.night.text,
  },
  syncInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  syncInputNight: {
    borderColor: colors.gray[600],
    backgroundColor: colors.gray[700],
    color: colors.night.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  modalCancelButtonNight: {
    borderColor: colors.gray[600],
  },
  modalCancelButtonText: {
    color: colors.gray[600],
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});