import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const FriendItem = ({ item }) => (
  <View style={styles.friendItem}>
    <Text style={styles.nicknameText}>{item.nickname}</Text>
    <Text style={styles.emailText}>{item.email}</Text>
  </View>
);

export default function FriendsListScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriends(friendsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FriendItem item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não adicionou nenhum amigo.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  friendItem: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 20 },
  separator: { height: 1, backgroundColor: '#f0f0f0' },
  nicknameText: { fontSize: 18, fontWeight: 'bold' },
  emailText: { fontSize: 14, color: 'gray' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 50, fontSize: 16 },
});