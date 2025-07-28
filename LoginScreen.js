import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false); // Estado para controlar o loading

  const handleLogin = () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true); // Ativa o indicador de carregamento

    signInWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        // Sucesso! Navega para a LoadingScreen que fará a verificação do perfil.
        navigation.replace('Loading');
      })
      .catch((error) => {
        console.error("Erro de login:", error.code);
        Alert.alert("Erro ao logar", "Email ou senha inválidos. Por favor, tente novamente.");
      })
      .finally(() => {
        setLoading(false); // Desativa o indicador de carregamento em qualquer caso
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DivCa$h</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        onChangeText={setSenha}
        value={senha}
        secureTextEntry
      />
      
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