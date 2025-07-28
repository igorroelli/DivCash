import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsProvider } from './GroupsContext';

// Importe todas as suas telas
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import LoadingScreen from './LoadingScreen';
import ChooseNicknameScreen from './ChooseNicknameScreen';
import ChatsScreen from './ChatsScreen';
import ChatScreen from './ChatScreen';
import CreateGroupScreen from './CreateGroupScreen';
import EditGroupScreen from './EditGroupScreen';
import AddFriendScreen from './AddFriendScreen';
import FriendRequestsScreen from './FriendRequestsScreen';
import FriendsListScreen from './FriendsListScreen';
import AddMembersScreen from './AddMembersScreen';
import AddDebtScreen from './AddDebtScreen';
import SettingsScreen from './SettingsScreen';
import GroupDebtsScreen from './GroupDebtsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GroupsProvider> 
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {/* Telas de Autenticação e Configuração de Perfil */}
          <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Crie sua Conta' }} />
          <Stack.Screen name="ChooseNickname" component={ChooseNicknameScreen} options={{ title: 'Escolha seu Apelido', headerLeft: null, gestureEnabled: false }} />
          
          {/* Telas Principais do App */}
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Novo Grupo' }} />
          <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: 'Gerenciar Grupo' }} />
          
          {/* Telas de Amizade, Membros e Configurações */}
          <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Adicionar Amigo' }} />
          <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Convites' }} />
          <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Meus Amigos' }} />
          <Stack.Screen name="AddMembers" component={AddMembersScreen} options={{ title: 'Adicionar Membros' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />

          {/* Telas de Dívidas */}
          <Stack.Screen name="AddDebt" component={AddDebtScreen} options={{ title: 'Dividir Nova Dívida' }} />
          <Stack.Screen name="GroupDebts" component={GroupDebtsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GroupsProvider>
  );
}