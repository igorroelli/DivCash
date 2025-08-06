import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsProvider } from './GroupsContext';
import { MenuProvider } from 'react-native-popup-menu'; // <-- PASSO 1: IMPORTE O PROVIDER

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
import AddExpenseScreen from './AddExpenseScreen';
import GroupBalanceScreen from './GroupBalanceScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    // <-- PASSO 2: ENVOLVA TUDO COM O MENUPROVIDER -->
    // A ordem aqui é importante: MenuProvider deve ser um dos mais externos.
    <MenuProvider>
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
            {/* Telas de Autenticação e Configuração */}
            <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Crie sua Conta' }} />
            <Stack.Screen name="ChooseNickname" component={ChooseNicknameScreen} options={{ title: 'Escolha seu Apelido', headerLeft: null }} />
            
            {/* Telas Principais do App */}
            <Stack.Screen name="Chats" component={ChatsScreen} options={{ title: 'DivCash' }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Novo Grupo' }} />
            <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: 'Editar Grupo' }} />
            <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Adicionar Amigo' }} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Convites' }} />
            <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Meus Amigos' }} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Adicionar Despesa' }} />
            <Stack.Screen name="GroupBalance" component={GroupBalanceScreen} options={{ title: 'Balanço do Grupo' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </GroupsProvider>
    </MenuProvider>
  );
}