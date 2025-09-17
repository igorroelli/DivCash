import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useGroups } from './GroupsContext';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';
import { pickImageFromLibrary } from './utils/imagePickerHelper';

export default function ChatScreen({ route, navigation }) {
  const { groupId, groupName } = route.params; 
  const { groups, updateGroup } = useGroups();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const user = auth.currentUser;

  const currentGroup = groups.find(g => g.id === groupId);

  const handleUpdateGroupImage = () => {
    setIsModalVisible(false);
    setTimeout(async () => {
      const localUri = await pickImageFromLibrary({ aspect: [1, 1] });
      if (localUri) {
        try {
          Alert.alert("Atualizando foto", "Aguarde...");
          const avatarUrl = await uploadImageToCloudinary(localUri);
          await updateGroup(groupId, { avatar: avatarUrl });
        } catch (error) {
          Alert.alert("Erro", "Não foi possível atualizar a imagem.");
        }
      }
    }, 200);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        const hasCustomAvatar = currentGroup?.avatar && currentGroup.avatar.includes('cloudinary');
        return (
          <TouchableOpacity style={styles.headerTitleContainer} onPress={() => setIsModalVisible(true)}>
            {hasCustomAvatar ? (
              <Image source={{ uri: currentGroup.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <MaterialIcons name="camera-alt" size={20} color="#fff" />
              </View>
            )}
            <Text style={styles.headerTitleText}>{currentGroup ? currentGroup.name : groupName}</Text>
          </TouchableOpacity>
        );
      },
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => { if (currentGroup) { navigation.navigate('GroupBalance', { groupId: currentGroup.id }); } }}>
            <MaterialIcons name="assessment" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => { if (currentGroup) { navigation.navigate('EditGroup', { group: currentGroup }); } }}>
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentGroup]);

  useEffect(() => {
    if (!groupId) return;
    const messagesCollectionRef = collection(db, 'groups', groupId, 'messages');
    const q = query(messagesCollectionRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || !user) return;
    const messagesCollectionRef = collection(db, 'groups', groupId, 'messages');
    try {
      await addDoc(messagesCollectionRef, { text: inputText, createdAt: serverTimestamp(), senderId: user.uid, senderEmail: user.email });
      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, { lastMessage: inputText });
      setInputText('');
    } catch (error) { console.error("Erro ao enviar mensagem: ", error); }
  };

  const renderMessage = ({ item }) => (
    <View style={[ styles.messageBubble, item.senderId === user.uid ? styles.myMessage : styles.otherMessage ]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {currentGroup?.avatar && currentGroup.avatar.includes('cloudinary') ? (
              <Image source={{ uri: currentGroup.avatar }} style={styles.modalImage} />
            ) : (
              <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                <MaterialIcons name="group" size={100} color="#a5d6a7" />
              </View>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={handleUpdateGroupImage}>
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Trocar de Imagem</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <FlatList data={messages} renderItem={renderMessage} keyExtractor={item => item.id} contentContainerStyle={styles.messagesContainer} />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => { if (currentGroup) { navigation.navigate('AddExpense', { group: currentGroup }) } }}>
          <MaterialIcons name="add-circle-outline" size={28} color="#555" />
        </TouchableOpacity>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Digite uma mensagem..." />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ece5dd' },
    messagesContainer: { paddingVertical: 10, paddingHorizontal: 10 },
    messageBubble: { padding: 12, borderRadius: 20, maxWidth: '80%', marginBottom: 10, elevation: 1 },
    myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end' },
    otherMessage: { backgroundColor: '#fff', alignSelf: 'flex-start' },
    messageText: { fontSize: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ddd' },
    actionButton: { padding: 5, marginRight: 5 },
    input: { flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
    headerAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    headerTitleText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 15, padding: 20, alignItems: 'center' },
    modalImage: { width: 250, height: 250, borderRadius: 125, marginBottom: 20, borderWidth: 3, borderColor: '#4CAF50', backgroundColor: '#f0f0f0' },
    modalImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    modalButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
    modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});