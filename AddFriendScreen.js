import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

export default function AddFriendScreen() {
  const [searchNickname, setSearchNickname] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const currentUser = auth.currentUser;

  const handleSearch = async () => {
    if (searchNickname.trim().length < 3) {
      Alert.alert('Erro', 'Digite pelo menos 3 caracteres para buscar.');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setSearchResults([]);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('nickname', '==', searchNickname.trim()));
    
    try {
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
          results.push(doc.data());
        }
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar usuário: ", error);
      Alert.alert('Erro', 'Ocorreu um problema ao buscar o usuário. Verifique se o índice do Firestore foi criado.');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipient) => {
    const senderDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const senderNickname = senderDoc.data().nickname;

    try {
      // CORREÇÃO PRINCIPAL: Garante que todos os campos, incluindo e-mails, sejam salvos
      await addDoc(collection(db, 'friendRequests'), {
        from: currentUser.uid,
        fromEmail: currentUser.email,
        fromNickname: senderNickname,
        to: recipient.uid,
        toEmail: recipient.email,
        toNickname: recipient.nickname,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Sucesso', `Convite enviado para ${recipient.nickname}`);
      setSearchNickname('');
      setSearchResults([]);
      setHasSearched(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o convite.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Buscar amigo por apelido"
        value={searchNickname}
        onChangeText={setSearchNickname}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Buscar</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <View>
                <Text style={styles.nicknameText}>{item.nickname}</Text>
                <Text style={styles.emailText}>{item.email}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => sendFriendRequest(item)}>
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            hasSearched ? <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fa' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  nicknameText: { fontSize: 16, fontWeight: 'bold' },
  emailText: { fontSize: 12, color: 'gray' },
  addButton: { backgroundColor: '#2196F3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
  addButtonText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});