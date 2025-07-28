import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useGroups } from './GroupsContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const { addGroup } = useGroups();
  const currentUser = auth.currentUser;

  // Busca a lista de amigos do usuário no Firestore
  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriends(friendsList);
    });
    return () => unsubscribe();
  }, []);

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim().length === 0) {
      Alert.alert('Erro', 'O nome do grupo não pode ser vazio.');
      return;
    }
    
    // Junta o ID do usuário atual com os IDs dos amigos selecionados
    const members = [currentUser.uid, ...selectedFriends];
    
    // Chama a função do contexto para criar o grupo no Firestore
    addGroup(groupName, members);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar um Novo Grupo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Grupo"
        value={groupName}
        onChangeText={setGroupName}
      />
      
      <Text style={styles.subtitle}>Adicionar Amigos</Text>
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.friendItem} onPress={() => toggleFriendSelection(item.id)}>
            <Text style={styles.friendName}>{item.nickname || item.email}</Text>
            <MaterialIcons 
              name={selectedFriends.includes(item.id) ? "check-box" : "check-box-outline-blank"}
              size={24} 
              color="#4CAF50"
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não tem amigos para adicionar.</Text>}
        style={styles.list}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
        <Text style={styles.buttonText}>Criar Grupo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1e1e1e', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  list: { width: '100%', flex: 1, marginBottom: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#fff' },
  friendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  friendName: { fontSize: 16 },
  emptyText: { color: 'gray', textAlign: 'center', paddingVertical: 20 },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});