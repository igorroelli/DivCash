import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';

export default function ImageUploaderScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à galeria para escolher uma foto.');
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao abrir a galeria:", error);
      Alert.alert("Erro", "Não foi possível abrir a galeria de imagens.");
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("Nenhuma imagem selecionada", "Por favor, escolha uma imagem primeiro.");
      return;
    }
    setLoading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(imageUri);
      Alert.alert(
        "Upload Concluído!",
        `A imagem foi salva no Cloudinary. URL: ${imageUrl}`
      );
      setImageUri(null);
    } catch (error) {
      Alert.alert("Erro no Upload", "Não foi possível enviar a imagem para o Cloudinary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload de Imagem</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="add-a-photo" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Clique para escolher uma foto</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, (!imageUri || loading) && styles.disabledButton]} onPress={handleUpload} disabled={!imageUri || loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar para o Cloudinary</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#1e1e1e' },
  imagePicker: { width: '100%', height: 250, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, marginBottom: 30, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: '100%', borderRadius: 10 },
  placeholder: { alignItems: 'center' },
  placeholderText: { marginTop: 10, color: '#aaa', fontSize: 16 },
  button: { width: '100%', height: 50, backgroundColor: '#007BFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#a9d6ff' },
});