import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

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
    <View style={styles.container}>
      <Text style={styles.title}>DivCa$h</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" onChangeText={setSenha} value={senha} secureTextEntry />
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 10 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f7fa", alignItems: "center", justifyContent: "center", padding: 20 },
    title: { fontSize: 36, fontWeight: "bold", marginBottom: 40, color: "#1e1e1e" },
    input: { width: "100%", height: 50, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, elevation: 3 },
    button: { width: "100%", height: 50, backgroundColor: "#4CAF50", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    linkText: { color: "#4CAF50", fontSize: 16, marginTop: 8 },
});