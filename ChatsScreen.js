import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useGroups } from './GroupsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

const GroupItem = ({ item, navigation, onDelete }) => {
  const hasCustomAvatar = item.avatar && item.avatar.includes('cloudinary');

  return (
    <TouchableOpacity 
      style={styles.groupItemContainer} 
      onPress={() => navigation.navigate('Chat', { groupId: item.id, groupName: item.name })}
      onLongPress={() => {
        Alert.alert( 'Excluir Grupo', `Você tem certeza que deseja excluir o grupo "${item.name}"?`,
          [ { text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) } ]
        );
      }}
    >
      {hasCustomAvatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialIcons name="group" size={24} color="#fff" />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatsScreen({ navigation }) {
  const { groups, deleteGroup, loading, currentUserProfile } = useGroups();

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.replace('Login');
    }).catch(error => console.error(error));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentUserProfile?.nickname || 'DivCash',
      headerRight: () => (
        <Menu>
          <MenuTrigger style={{ padding: 10 }}>
            <MaterialIcons name="more-vert" size={28} color="white" />
          </MenuTrigger>
          <MenuOptions customStyles={menuOptionsStyles}>
            <MenuOption onSelect={() => navigation.navigate('AddFriend')}>
              <View style={styles.menuItem}>
                <MaterialIcons name="person-add" size={24} color="#333" />
                <Text style={styles.menuItemText}>Adicionar Amigo</Text>
              </View>
            </MenuOption>
            <View style={styles.divider} />
            <MenuOption onSelect={() => navigation.navigate('FriendsList')}>
              <View style={styles.menuItem}>
                <MaterialIcons name="people" size={24} color="#333" />
                <Text style={styles.menuItemText}>Meus Amigos</Text>
              </View>
            </MenuOption>
            <View style={styles.divider} />
            <MenuOption onSelect={() => navigation.navigate('FriendRequests')}>
              <View style={styles.menuItem}>
                <MaterialIcons name="notifications" size={24} color="#333" />
                <Text style={styles.menuItemText}>Convites</Text>
              </View>
            </MenuOption>
            <View style={styles.divider} />
            <MenuOption onSelect={() => navigation.navigate('ImageUploader')}>
              <View style={styles.menuItem}>
                <MaterialIcons name="cloud-upload" size={24} color="#333" />
                <Text style={styles.menuItemText}>Testar Upload</Text>
              </View>
            </MenuOption>
            <View style={styles.divider} />
            <MenuOption onSelect={handleLogout}>
              <View style={styles.menuItem}>
                <MaterialIcons name="logout" size={24} color="#f44336" />
                <Text style={[styles.menuItemText, { color: '#f44336' }]}>Sair</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
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

const menuOptionsStyles = {
  optionsContainer: {
    borderRadius: 8,
    padding: 5,
    marginTop: 40,
  },
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    groupItemContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    avatarPlaceholder: { backgroundColor: '#a5d6a7', justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1 },
    groupName: { fontSize: 17, fontWeight: 'bold', color: '#1e1e1e' },
    lastMessage: { fontSize: 15, color: '#666', marginTop: 2 },
    separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 82 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
    fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#4CAF50', borderRadius: 28, elevation: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    menuItemText: { marginLeft: 15, fontSize: 16, color: '#333' },
    divider: { height: 1, backgroundColor: '#f0f0f0' },
});