import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useGroups } from './GroupsContext';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';

// Componente para exibir cada membro do grupo
const MemberItem = ({ member }) => (
  <View style={styles.memberItem}>
    <Text style={styles.memberName}>{member.nickname || member.email}</Text>
  </View>
);

export default function EditGroupScreen({ route, navigation }) {
  const { group } = route.params; 
  const { updateGroup } = useGroups();
  const currentUser = auth.currentUser;
  
  const [groupName, setGroupName] = useState(group.name);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca os perfis completos dos membros do grupo
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const q = await getDocs(usersRef);
      const allUsers = {};
      q.forEach(doc => {
        allUsers[doc.id] = doc.data();
      });

      const memberProfiles = group.members.map(memberId => allUsers[memberId]).filter(Boolean);
      setMembers(memberProfiles);
      setIsLoading(false);
    };
    fetchMembers();
  }, [group.members]);

  const handleSaveChanges = async () => { /* ... (mesma função de antes) ... */ };
  const handleLeaveGroup = () => { /* ... (mesma função de antes) ... */ };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Seção 1: Editar Nome */}
      <Text style={styles.sectionTitle}>Nome do Grupo</Text>
      <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} />
      <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
        <Text style={styles.buttonText}>Salvar Nome</Text>
      </TouchableOpacity>

      {/* Seção 2: Membros Atuais */}
      <Text style={styles.sectionTitle}>{members.length} Membros</Text>
      <FlatList
        data={members}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => <MemberItem member={item} />}
        style={styles.list}
      />

      {/* Seção 3: Adicionar Amigos */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddMembers', { group })}>
        <Text style={styles.buttonText}>Adicionar Amigos ao Grupo</Text>
      </TouchableOpacity>

      {/* Seção 4: Sair do Grupo */}
      <TouchableOpacity style={[styles.button, styles.leaveButton]} onPress={handleLeaveGroup}>
        <Text style={styles.buttonText}>Sair do Grupo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { maxHeight: 200, width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#fff' },
  memberItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16 },
  leaveButton: { backgroundColor: '#f44336', marginTop: 30 },
});