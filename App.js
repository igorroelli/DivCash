import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsProvider } from './GroupsContext';
import { MenuProvider } from 'react-native-popup-menu';

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
import RouteMapScreen from './RouteMapScreen';
import ImageUploaderScreen from './ImageUploaderScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
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
            <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Crie sua Conta' }} />
            <Stack.Screen name="ChooseNickname" component={ChooseNicknameScreen} options={{ title: 'Escolha seu Apelido', headerLeft: null }} />
            <Stack.Screen name="Chats" component={ChatsScreen} options={{ title: 'DivCash' }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Novo Grupo' }} />
            <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: 'Editar Grupo' }} />
            <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Adicionar Amigo' }} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Convites' }} />
            <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Meus Amigos' }} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Adicionar Despesa' }} />
            <Stack.Screen name="GroupBalance" component={GroupBalanceScreen} options={{ title: 'Balanço do Grupo' }} />
            <Stack.Screen name="RouteMap" component={RouteMapScreen} options={{ title: 'Trajeto da Viagem' }} />
            <Stack.Screen name="ImageUploader" component={ImageUploaderScreen} options={{ title: 'Upload de Imagem' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </GroupsProvider>
    </MenuProvider>
  );
}