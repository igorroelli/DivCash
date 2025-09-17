import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Image, ActivityIndicator } from 'react-native';
import { useGroups } from './GroupsContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { pickImageFromLibrary } from './utils/imagePickerHelper';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addGroup } = useGroups();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriends(friendsList);
    });
    return () => unsubscribe();
  }, []);

  const handlePickImage = async () => {
    const uri = await pickImageFromLibrary({ aspect: [1, 1] });
    if (uri) {
      setGroupImage(uri);
    }
  };

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleCreateGroup = async () => {
    if (groupName.trim().length === 0) {
      Alert.alert('Erro', 'O nome do grupo não pode ser vazio.');
      return;
    }
    setIsLoading(true);
    try {
      let avatarUrl = null;
      if (groupImage) {
        avatarUrl = await uploadImageToCloudinary(groupImage);
      }
      const members = [currentUser.uid, ...selectedFriends];
      await addGroup(groupName, members, avatarUrl);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o grupo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
        {groupImage ? (
          <Image source={{ uri: groupImage }} style={styles.groupAvatar} />
        ) : (
          <View style={[styles.groupAvatar, styles.placeholder]}>
            <MaterialIcons name="camera-alt" size={40} color="#ccc" />
            <Text style={styles.placeholderText}>Escolher Imagem</Text>
          </View>
        )}
      </TouchableOpacity>
      <TextInput style={styles.input} placeholder="Nome do Grupo" value={groupName} onChangeText={setGroupName} />
      <Text style={styles.subtitle}>Adicionar Amigos</Text>
      <FlatList
        style={styles.list}
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.friendItem} onPress={() => toggleFriendSelection(item.id)}>
            <Text style={styles.friendName}>{item.nickname || item.email}</Text>
            <MaterialIcons name={selectedFriends.includes(item.id) ? "check-box" : "check-box-outline-blank"} size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não tem amigos para adicionar.</Text>}
      />
      <TouchableOpacity style={[styles.button, isLoading && styles.disabledButton]} onPress={handleCreateGroup} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar Grupo</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 20 },
  imagePicker: { alignItems: 'center', marginBottom: 20 },
  groupAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0' },
  placeholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
  placeholderText: { color: '#aaa', marginTop: 5 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  list: { flex: 1, width: '100%' },
  friendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  friendName: { fontSize: 16 },
  emptyText: { color: 'gray', textAlign: 'center' },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  disabledButton: { backgroundColor: '#a5d6a7' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});