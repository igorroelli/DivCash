import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { useGroups } from './GroupsContext';

export default function ChatScreen({ route, navigation }) {
  const { groupId, groupName } = route.params; 
  const { groups } = useGroups();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const user = auth.currentUser;
  const currentGroup = groups.find(g => g.id === groupId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentGroup ? currentGroup.name : groupName,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {/* BOTÃO PARA A TELA DE DÍVIDAS DO GRUPO */}
          <TouchableOpacity 
            style={{ padding: 5, marginRight: 10 }}
            onPress={() => {
              if (currentGroup) {
                navigation.navigate('GroupDebts', { group: currentGroup });
              }
            }}
          >
            <MaterialIcons name="receipt-long" size={24} color="white" />
          </TouchableOpacity>
          {/* BOTÃO PARA A TELA DE EDIÇÃO DO GRUPO */}
          <TouchableOpacity 
            style={{ padding: 5, marginRight: 10 }} 
            onPress={() => { 
              if (currentGroup) { 
                navigation.navigate('EditGroup', { group: currentGroup }); 
              } 
            }}
          >
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, groupName, currentGroup]);

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
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (currentGroup) {
              navigation.navigate('AddDebt', { group: currentGroup });
            }
          }}
        >
          <MaterialIcons name="request-quote" size={24} color="#555" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite uma mensagem..."
        />
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
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ddd' },
    actionButton: { padding: 8 },
    input: { flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
});