import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useGroups } from './GroupsContext';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { pickImageFromLibrary } from './utils/imagePickerHelper';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';

export default function EditGroupScreen({ route, navigation }) {
  const { group } = route.params; 
  const { updateGroup } = useGroups();
  const currentUser = auth.currentUser;
  
  const [groupName, setGroupName] = useState(group.name);
  const [groupImage, setGroupImage] = useState(group.avatar);
  const [friends, setFriends] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      const memberProfilePromises = group.members.map(memberId => getDoc(doc(db, 'users', memberId)));
      const memberDocs = await Promise.all(memberProfilePromises);
      const memberProfiles = memberDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() }));
      setCurrentMembers(memberProfiles);

      const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
      const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
        const friendsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const friendsToAdd = friendsList.filter(friend => !group.members.includes(friend.id));
        setFriends(friendsToAdd);
      });
      
      setIsLoading(false);
      return unsubscribe;
    };

    const unsubscribePromise = fetchData();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [group.members]);

  const handlePickImage = async () => {
    const uri = await pickImageFromLibrary({ aspect: [1, 1] });
    if (uri) {
      setGroupImage(uri);
    }
  };

  const handleSaveChanges = async () => {
    if (groupName.trim().length === 0) {
      Alert.alert('Erro', 'O nome do grupo não pode ser vazio.');
      return;
    }
    
    setIsSaving(true);
    let newAvatarUrl = group.avatar;

    try {
      if (groupImage && groupImage !== group.avatar) {
        newAvatarUrl = await uploadImageToCloudinary(groupImage);
      }
      const updatedData = { name: groupName.trim(), avatar: newAvatarUrl };
      await updateGroup(group.id, updatedData);
      setIsSaving(false);
      Alert.alert('Sucesso', 'Grupo atualizado!');
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      setIsSaving(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Nenhum amigo selecionado', 'Selecione pelo menos um amigo para adicionar.');
      return;
    }
    setIsSaving(true);
    const newMembersList = [...group.members, ...selectedFriends];
    await updateGroup(group.id, { members: newMembersList });
    setIsSaving(false);
    Alert.alert('Sucesso', 'Amigos adicionados ao grupo!');
    setSelectedFriends([]);
  };

  const handleLeaveGroup = () => {
    Alert.alert('Sair do Grupo', `Você tem certeza que deseja sair do grupo "${group.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => {
            setIsLoading(true);
            const newMembersList = group.members.filter(memberId => memberId !== currentUser.uid);
            await updateGroup(group.id, { members: newMembersList });
            setIsLoading(false);
            navigation.navigate('Chats');
          }
        }
      ]
    );
  };

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerSection}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image source={{ uri: groupImage }} style={styles.groupAvatar} />
          <View style={styles.cameraIcon}><MaterialIcons name="camera-alt" size={20} color="#fff" /></View>
        </TouchableOpacity>
        <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} />
      </View>
      <TouchableOpacity style={[styles.button, isSaving && styles.disabledButton]} onPress={handleSaveChanges} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar Alterações</Text>}
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Membros Atuais</Text>
      <View style={styles.listContainer}>
        {currentMembers.map(item => (
          <View key={item.id} style={styles.memberItem}><Text style={styles.memberName}>{item.nickname || item.email}</Text></View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Adicionar Amigos ao Grupo</Text>
      <View style={styles.listContainer}>
        {friends.length > 0 ? (
          friends.map(item => (
            <TouchableOpacity key={item.id} style={styles.friendItem} onPress={() => toggleFriendSelection(item.id)}>
              <Text style={styles.memberName}>{item.nickname || item.email}</Text>
              <MaterialIcons name={selectedFriends.includes(item.id) ? "check-box" : "check-box-outline-blank"} size={24} color="#4CAF50" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Todos os seus amigos já estão neste grupo.</Text>
        )}
      </View>
      <TouchableOpacity style={[styles.button, selectedFriends.length === 0 && styles.disabledButton]} onPress={handleAddMembers} disabled={isSaving || selectedFriends.length === 0}>
        <Text style={styles.buttonText}>Adicionar Membros</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.leaveButton]} onPress={handleLeaveGroup} disabled={isSaving}>
        <Text style={styles.buttonText}>Sair do Grupo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 20 },
  groupAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', marginBottom: 15 },
  cameraIcon: { position: 'absolute', bottom: 10, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 10, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, borderWidth: 1, borderColor: '#ddd', textAlign: 'center', fontWeight: 'bold' },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listContainer: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#fff' },
  memberItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16 },
  friendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  emptyText: { color: 'gray', textAlign: 'center', padding: 20 },
  disabledButton: { backgroundColor: '#a5d6a7' },
  leaveButton: { backgroundColor: '#f44336', marginTop: 30 },
});