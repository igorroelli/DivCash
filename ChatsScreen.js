import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useGroups } from './GroupsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

const GroupItem = ({ item, navigation, onDelete }) => (
  <TouchableOpacity 
    style={styles.groupItemContainer} 
    onPress={() => navigation.navigate('Chat', { groupId: item.id, groupName: item.name })}
    onLongPress={() => {
      Alert.alert('Excluir Grupo', `Você tem certeza que deseja excluir o grupo "${item.name}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) }])
    }}
  >
    <Image source={{ uri: item.avatar }} style={styles.avatar} />
    <View style={styles.textContainer}>
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
    </View>
  </TouchableOpacity>
);

export default function ChatsScreen({ navigation }) {
  const { groups, deleteGroup, loading, currentUserProfile } = useGroups();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentUserProfile?.nickname || 'DivCash',
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 15, padding: 5 }}>
          <MaterialIcons name="settings" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerLeft: null,
      gestureEnabled: false,
    });
  }, [navigation, currentUserProfile]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        renderItem={({ item }) => <GroupItem item={item} navigation={navigation} onDelete={deleteGroup} />}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum grupo encontrado. Crie um novo!</Text>}
      />
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreateGroup')}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    groupItemContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0e0e0', marginRight: 16 },
    textContainer: { flex: 1 },
    groupName: { fontSize: 17, fontWeight: 'bold', color: '#1e1e1e' },
    lastMessage: { fontSize: 15, color: '#666', marginTop: 2 },
    separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 82 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
    fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#4CAF50', borderRadius: 28, elevation: 8 },
});