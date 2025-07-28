import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Importe updateProfile
import { db, auth } from './firebaseConfig';

export default function ChooseNicknameScreen({ navigation }) {
  const [nickname, setNickname] = useState('');

  const handleSaveNickname = async () => {
    if (nickname.trim().length < 3) {
      Alert.alert('Apelido Inválido', 'Seu apelido deve ter pelo menos 3 caracteres.');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        // Atualiza o documento no Firestore
        await updateDoc(userDocRef, {
          nickname: nickname.trim(),
        });
        // Atualiza o perfil do Auth
        await updateProfile(user, {
          displayName: nickname.trim(),
        });
        navigation.replace('Chats');
      } catch (error) {
        console.error("Erro ao salvar apelido: ", error);
        Alert.alert('Erro', 'Não foi possível salvar seu apelido.');
      }
    }
  };
  // ... (o resto do componente e estilos são os mesmos)
}