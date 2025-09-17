import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';
import 'react-native-get-random-values';

export default function ChooseNicknameScreen({ navigation }) {
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao abrir a galeria:", error);
      Alert.alert("Erro", "Não foi possível abrir a galeria de imagens.");
    }
  };

  const handleSaveProfile = async () => {
    if (nickname.trim().length < 3) {
      Alert.alert('Apelido Inválido', 'Seu apelido deve ter pelo menos 3 caracteres.');
      return;
    }
    setLoading(true);

    try {
      let avatarUrl = `https://ui-avatars.com/api/?name=${nickname.charAt(0)}&background=random`;
      
      if (profileImage) {
        avatarUrl = await uploadImageToCloudinary(profileImage);
      }

      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, {
        nickname: nickname.trim(),
        avatarUrl: avatarUrl,
      });
      
      await updateProfile(user, {
        displayName: nickname.trim(),
        photoURL: avatarUrl,
      });

      navigation.replace('Chats');
    } catch (error) {
      console.error("Erro ao salvar perfil: ", error);
      Alert.alert('Erro', 'Não foi possível salvar seu perfil.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Image
              source={profileImage ? { uri: profileImage } : require('./assets/avatar-placeholder.png')}
              style={styles.modalImage}
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => {
                setIsModalVisible(false);
                setTimeout(() => pickImage(), 100);
              }}
            >
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Trocar de Foto</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <Image
          source={profileImage ? { uri: profileImage } : require('./assets/avatar-placeholder.png')}
          style={styles.avatar}
        />
        <Text style={styles.changePhotoText}>Escolher Foto</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Crie seu Apelido</Text>
      <TextInput style={styles.input} placeholder="Como você quer ser chamado?" value={nickname} onChangeText={setNickname} />
      
      <TouchableOpacity style={[styles.button, loading && styles.disabledButton]} onPress={handleSaveProfile} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar e Entrar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", alignItems: "center", justifyContent: "center", padding: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', marginBottom: 10, borderWidth: 2, borderColor: '#ddd' },
  changePhotoText: { color: '#4CAF50', fontSize: 16, marginBottom: 30, fontWeight: 'bold' },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  input: { width: "100%", height: 50, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { width: "100%", height: 50, backgroundColor: "#4CAF50", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { backgroundColor: '#a5d6a7' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 15, padding: 20, alignItems: 'center' },
  modalImage: { width: 250, height: 250, borderRadius: 125, marginBottom: 20, borderWidth: 3, borderColor: '#4CAF50', backgroundColor: '#f0f0f0' },
  modalButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});