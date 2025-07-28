import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useGroups } from './GroupsContext';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddMembersScreen({ route, navigation }) {
  const { group } = route.params;
  const { updateGroup } = useGroups();
  const currentUser = auth.currentUser;

  const [friendsToAdd, setFriendsToAdd] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca a lista de amigos do usuário que AINDA NÃO ESTÃO no grupo
  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredFriends = friendsList.filter(friend => !group.members.includes(friend.id));
      setFriendsToAdd(filteredFriends);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [group.members]);

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Nenhum amigo selecionado', 'Selecione pelo menos um amigo para adicionar.');
      return;
    }
    setLoading(true);
    const newMembersList = [...group.members, ...selectedFriends];
    await updateGroup(group.id, { members: newMembersList });
    setLoading(false);
    Alert.alert('Sucesso', 'Amigos adicionados ao grupo!');
    navigation.goBack(); // Volta para a tela de edição
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friendsToAdd}
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
        ListEmptyComponent={<Text style={styles.emptyText}>Todos os seus amigos já estão neste grupo.</Text>}
      />
      <TouchableOpacity 
        style={[styles.button, selectedFriends.length === 0 && styles.disabledButton]} 
        onPress={handleAddMembers}
        disabled={selectedFriends.length === 0}
      >
        <Text style={styles.buttonText}>Adicionar Selecionados</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  friendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  friendName: { fontSize: 16 },
  emptyText: { color: 'gray', textAlign: 'center', padding: 20, fontSize: 16 },
  button: { backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 20, height: 50 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#a5d6a7' },
});
