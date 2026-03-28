import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { colors } from "@/constants/colors";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { Product } from "@/types";
import { ArrowLeft, Edit, Trash2, Camera, Image as ImageIcon } from "lucide-react-native";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProductStore((state) => state.products);
  const categories = useProductStore((state) => state.categories);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const addProduct = useProductStore((state) => state.addProduct);
  const generateProductCode = useProductStore((state) => state.generateProductCode);
  const nightMode = useSettingsStore((state) => state.nightMode);
  const busyMode = useSettingsStore((state) => state.busyMode);
  
  const [product, setProduct] = useState(
    id === "new" ? null : products.find((p) => p.id === id) || null
  );
  const [editing, setEditing] = useState(id === "new");
  
  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCode(product.code);
      setBuyPrice(product.buyPrice.toString());
      setSellPrice(product.sellPrice.toString());
      setStock(product.stock !== undefined ? product.stock.toString() : "");
      setCategory(product.category);
      setImage(product.image || "");
    } else if (id === "new") {
      // Initialize new product
      setCode(generateProductCode());
      setCategory(categories[0] || "");
    }
  }, [product, id, categories, generateProductCode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Nama produk harus diisi";
    if (!code.trim()) newErrors.code = "Kode produk harus diisi";
    if (!buyPrice) newErrors.buyPrice = "Harga beli harus diisi";
    if (!sellPrice) newErrors.sellPrice = "Harga jual harus diisi";
    if (!category) newErrors.category = "Kategori harus dipilih";

    if (parseFloat(buyPrice) <= 0) newErrors.buyPrice = "Harga beli harus lebih dari 0";
    if (parseFloat(sellPrice) <= 0) newErrors.sellPrice = "Harga jual harus lebih dari 0";
    if (stock && parseFloat(stock) < 0) newErrors.stock = "Stok tidak boleh negatif";

    // Check if code already exists (for new products or when changing code)
    const existingProduct = products.find(p => p.code.toLowerCase() === code.toLowerCase() && p.id !== id);
    if (existingProduct) {
      newErrors.code = "Kode produk sudah digunakan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const productData = {
      name: name.trim(),
      code: code.trim(),
      buyPrice: parseFloat(buyPrice),
      sellPrice: parseFloat(sellPrice),
      stock: stock ? parseFloat(stock) : undefined,
      category,
      image: image || undefined,
    };

    if (id === "new") {
      addProduct(productData);
      Alert.alert("Sukses", "Produk berhasil ditambahkan", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      updateProduct(id, productData);
      setProduct({
        ...product!,
        ...productData,
      });
      setEditing(false);
      Alert.alert("Sukses", "Produk berhasil diperbarui");
    }
  };

  const handleDelete = () => {
    if (!product) return;
    
    Alert.alert(
      "Konfirmasi",
      "Apakah Anda yakin ingin menghapus produk ini?",
      [
        { text: "Batal" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteProduct(product.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleImagePicker = () => {
    Alert.alert(
      "Pilih Gambar",
      "Pilih sumber gambar",
      [
        { text: "Batal", style: "cancel" },
        { text: "Kamera", onPress: () => pickImage('camera') },
        { text: "Galeri", onPress: () => pickImage('library') },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Error", "Izin kamera diperlukan");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Gagal memilih gambar");
    }
  };

  if (id !== "new" && !product) {
    return (
      <SafeAreaView style={[styles.container, nightMode && styles.containerNight]}>
        <Stack.Screen options={{ title: "Detail Produk" }} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, nightMode && styles.notFoundTextNight]}>
            Produk tidak ditemukan
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

  const containerStyle = [
    styles.container,
    nightMode && styles.containerNight
  ];

  return (
    <SafeAreaView style={containerStyle} edges={["bottom"]}>
      <Stack.Screen 
        options={{ 
          title: editing ? (id === "new" ? "Tambah Produk" : "Edit Produk") : "Detail Produk",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={nightMode ? colors.gray[100] : colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <Card variant="elevated" style={[nightMode && styles.cardNight]}>
          {editing ? (
            <View style={styles.editForm}>
              {/* Image Section */}
              <View style={styles.imageSection}>
                <Text style={[styles.imageLabel, nightMode && styles.imageLabelNight]}>
                  Gambar Produk
                </Text>
                <TouchableOpacity
                  style={[styles.imageContainer, nightMode && styles.imageContainerNight]}
                  onPress={handleImagePicker}
                >
                  {image ? (
                    <Image source={{ uri: image }} style={styles.productImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <ImageIcon size={32} color={colors.gray[400]} />
                      <Text style={[styles.imagePlaceholderText, nightMode && styles.imagePlaceholderTextNight]}>
                        Tap untuk menambah gambar
                      </Text>
                    </View>
                  )}
                  <View style={styles.cameraIcon}>
                    <Camera size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <Input
                label="Nama Produk"
                value={name}
                onChangeText={setName}
                error={errors.name}
                variant={nightMode ? "filled" : "default"}
              />
              
              <Input
                label="Kode Produk"
                value={code}
                onChangeText={setCode}
                error={errors.code}
                variant={nightMode ? "filled" : "default"}
              />
              
              <Input
                label="Harga Beli"
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
                error={errors.buyPrice}
                variant={nightMode ? "filled" : "default"}
              />
              
              <Input
                label="Harga Jual"
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="numeric"
                error={errors.sellPrice}
                variant={nightMode ? "filled" : "default"}
              />
              
              <Input
                label="Stok (Opsional)"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                error={errors.stock}
                variant={nightMode ? "filled" : "default"}
              />

              {/* Category Selector */}
              <View style={styles.categorySection}>
                <Text style={[styles.categoryLabel, nightMode && styles.categoryLabelNight]}>
                  Kategori
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryList}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          nightMode && styles.categoryChipNight,
                          category === cat && styles.categoryChipActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            nightMode && styles.categoryChipTextNight,
                            category === cat && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Batal"
                  onPress={() => {
                    if (id === "new") {
                      router.back();
                    } else {
                      setEditing(false);
                    }
                  }}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <Button
                  title={id === "new" ? "Tambah" : "Simpan"}
                  onPress={handleSave}
                  style={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.productDetails}>
              {/* Product Image */}
              {product?.image && (
                <View style={styles.imageDisplaySection}>
                  <Image source={{ uri: product.image }} style={styles.displayImage} />
                </View>
              )}

              <View style={styles.header}>
                <View>
                  <Text style={[styles.productName, nightMode && styles.productNameNight]}>
                    {product?.name}
                  </Text>
                  <Text style={[styles.productCode, nightMode && styles.productCodeNight]}>
                    Kode: {product?.code}
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{product?.category}</Text>
                </View>
              </View>

              <View style={[styles.divider, nightMode && styles.dividerNight]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                  Harga Jual
                </Text>
                <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                  {formatCurrency(product?.sellPrice || 0)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                  Harga Beli
                </Text>
                <Text style={[styles.detailValue, nightMode && styles.detailValueNight]}>
                  {formatCurrency(product?.buyPrice || 0)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                  Profit
                </Text>
                <Text style={styles.profitValue}>
                  {formatCurrency((product?.sellPrice || 0) - (product?.buyPrice || 0))}
                </Text>
              </View>
              
              {product?.stock !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, nightMode && styles.detailLabelNight]}>
                    Stok
                  </Text>
                  <Text style={[
                    styles.detailValue, 
                    nightMode && styles.detailValueNight,
                    product.stock < 10 && styles.lowStockValue
                  ]}>
                    {product.stock}
                  </Text>
                </View>
              )}

              <View style={styles.actionsContainer}>
                <Button
                  title="Edit"
                  onPress={() => setEditing(true)}
                  variant="outline"
                  style={styles.actionButton}
                  leftElement={<Edit size={16} color={colors.primary} />}
                />
                <Button
                  title="Hapus"
                  onPress={handleDelete}
                  variant="danger"
                  style={styles.actionButton}
                  leftElement={<Trash2 size={16} color="#FFFFFF" />}
                />
              </View>
            </View>
          )}
        </Card>
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
  },
  cardNight: {
    backgroundColor: colors.gray[800],
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
  productDetails: {
    padding: 8,
  },
  imageDisplaySection: {
    alignItems: "center",
    marginBottom: 20,
  },
  displayImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  productNameNight: {
    color: colors.gray[100],
  },
  productCode: {
    fontSize: 14,
    color: colors.gray[600],
  },
  productCodeNight: {
    color: colors.gray[400],
  },
  categoryBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginBottom: 16,
  },
  dividerNight: {
    backgroundColor: colors.gray[600],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.gray[600],
  },
  detailLabelNight: {
    color: colors.gray[400],
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  detailValueNight: {
    color: colors.gray[100],
  },
  profitValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.success,
  },
  lowStockValue: {
    color: colors.error,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  editForm: {
    padding: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    fontWeight: '600',
  },
  imageLabelNight: {
    color: colors.gray[100],
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  imageContainerNight: {
    backgroundColor: colors.gray[700],
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  imagePlaceholderTextNight: {
    color: colors.gray[400],
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    fontWeight: '600',
  },
  categoryLabelNight: {
    color: colors.gray[100],
  },
  categoryList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryChipNight: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  categoryChipTextNight: {
    color: colors.gray[100],
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: "row",
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