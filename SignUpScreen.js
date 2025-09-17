import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSignUp = () => {
    if (!email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    createUserWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        const user = userCredential.user;
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email.toLowerCase(),
        });
        navigation.replace('Loading');
      })
      .catch((error) => {
        let friendlyMessage = 'Ocorreu um erro ao criar a conta.';
        if (error.code === 'auth/email-already-in-use') { friendlyMessage = 'Este e-mail já está em uso.'; }
        else if (error.code === 'auth/invalid-email') { friendlyMessage = 'O e-mail é inválido.'; }
        else if (error.code === 'auth/weak-password') { friendlyMessage = 'A senha é muito fraca (mínimo 6 caracteres).'; }
        Alert.alert('Erro no Cadastro', friendlyMessage);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crie sua Conta</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha (mínimo 6 caracteres)" onChangeText={setSenha} value={senha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar Senha" onChangeText={setConfirmarSenha} value={confirmarSenha} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Já tem uma conta? Entrar</Text>
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

