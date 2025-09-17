import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { Alert } from 'react-native';

export default function SettingsScreen({ navigation }) {
  const handleLogout = () => { /* ... (mesma função de logout de antes) ... */ };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddFriend')}>
        <MaterialIcons name="person-add" size={24} color="#555" />
        <Text style={styles.menuText}>Adicionar Amigos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FriendsList')}>
        <MaterialIcons name="people" size={24} color="#555" />
        <Text style={styles.menuText}>Meus Amigos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FriendRequests')}>
        <MaterialIcons name="notifications" size={24} color="#555" />
        <Text style={styles.menuText}>Convites</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuItem, {marginTop: 20}]} onPress={handleLogout}>
        <MaterialIcons name="logout" size={24} color="#f44336" />
        <Text style={[styles.menuText, { color: '#f44336' }]}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuText: { fontSize: 18, marginLeft: 20, color: '#333' },
});