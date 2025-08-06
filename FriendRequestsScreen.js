import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';

export default function FriendRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('to', '==', currentUser.uid), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(reqs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleResponse = async (request, newStatus) => {
    const requestRef = doc(db, 'friendRequests', request.id);
    await updateDoc(requestRef, { status: newStatus });

    if (newStatus === 'accepted') {
      const myNickname = auth.currentUser.displayName;

      // Adiciona o amigo na sua lista de amigos
      const myFriendsRef = doc(db, 'users', currentUser.uid, 'friends', request.from);
      await setDoc(myFriendsRef, { 
        uid: request.from, 
        email: request.fromEmail, // Usa o e-mail do convite
        nickname: request.fromNickname 
      });

      // Adiciona você na lista de amigos dele
      const theirFriendsRef = doc(db, 'users', request.from, 'friends', currentUser.uid);
      await setDoc(theirFriendsRef, { 
        uid: currentUser.uid, 
        email: currentUser.email, 
        nickname: myNickname
      });
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text style={styles.emailText}>{item.fromNickname || item.fromEmail}</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.responseButton, styles.acceptButton]} onPress={() => handleResponse(item, 'accepted')}>
                <Text style={styles.buttonText}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.responseButton, styles.declineButton]} onPress={() => handleResponse(item, 'declined')}>
                <Text style={styles.buttonText}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum convite pendente.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  requestItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  emailText: { fontSize: 16, fontWeight: 'bold' },
  buttonsContainer: { flexDirection: 'row' },
  responseButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, marginLeft: 10 },
  acceptButton: { backgroundColor: '#4CAF50' },
  declineButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});