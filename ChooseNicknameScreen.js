import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from './firebaseConfig';

export default function ChooseNicknameScreen({ navigation }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveNickname = async () => {
    if (nickname.trim().length < 3) {
      Alert.alert('Apelido Inválido', 'Seu apelido deve ter pelo menos 3 caracteres.');
      return;
    }

    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        // Atualiza o documento no Firestore
        await updateDoc(userDocRef, {
          nickname: nickname.trim(),
        });
        // Atualiza o perfil do Auth (útil para acessar o apelido rapidamente)
        await updateProfile(user, {
          displayName: nickname.trim(),
        });
        // Navega para a tela principal
        navigation.replace('Chats');
      } catch (error) {
        console.error("Erro ao salvar apelido: ", error);
        Alert.alert('Erro', 'Não foi possível salvar seu apelido.');
        setLoading(false);
      }
    }
  };

  return (
    // O 'style={styles.container}' é essencial para a tela ser visível
    <View style={styles.container}>
      <Text style={styles.title}>Escolha seu Apelido</Text>
      <Text style={styles.subtitle}>Este será seu nome de usuário no app.</Text>
      
      {/* Este é o campo para digitar */}
      <TextInput
        style={styles.input}
        placeholder="Digite seu apelido"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
      />
      
      {/* Este é o botão para salvar */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleSaveNickname}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar e Continuar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, // Garante que a view ocupe toda a tela
    backgroundColor: "#f5f7fa", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 20 
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, color: "#1e1e1e" },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 40, textAlign: 'center' },
  input: { width: "100%", height: 50, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { width: "100%", height: 50, backgroundColor: "#4CAF50", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { backgroundColor: '#a5d6a7' },
});