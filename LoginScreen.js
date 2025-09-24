import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.replace('Loading');
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
          Alert.alert("Erro ao logar", "O e-mail ou a senha que você digitou está incorreto.");
        } else {
          Alert.alert("Erro ao logar", "Ocorreu um problema inesperado.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <LinearGradient
      colors={['#00C9FF', '#92FE9D']}
      style={styles.container}
    >
      <Image
        source={require('./assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Removemos o 'formContainer' e colocamos os inputs diretamente aqui */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#555" // Cor do placeholder um pouco mais escura
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#555"
        onChangeText={setSenha}
        value={senha}
        secureTextEntry
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ height: 50, marginBottom: 12 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Criar conta</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center", // Voltamos para 'center' para um layout mais simples
      padding: 30, // Aumenta o padding lateral
    },
    logo: {
      width: '90%',
      height: 250, // <-- LOGO GRANDE
      marginBottom: 50, // Espaço entre o logo e os inputs
    },
    input: {
      width: "100%",
      height: 55,
      backgroundColor: "rgba(255, 255, 255, 0.9)", // Fundo branco sólido para os inputs
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 16,
      fontSize: 16,
      color: '#333',
    },
    button: {
      width: "100%",
      height: 50,
      backgroundColor: "#4CAF50",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      elevation: 3,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    linkText: {
      color: "#fff",
      fontSize: 16,
      marginTop: 15,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
});