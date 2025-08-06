import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

const GroupsContext = createContext();

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    // Estas variáveis vão guardar as funções para "desligar" os listeners
    let unsubscribeGroups = () => {};
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      // Sempre que o status de login mudar, desligamos os listeners antigos
      unsubscribeGroups();
      unsubscribeProfile();

      if (user) {
        setLoading(true);

        // Listener para buscar os grupos do usuário
        const groupsQuery = query(
          collection(db, 'groups'), 
          where('members', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );
        unsubscribeGroups = onSnapshot(groupsQuery, (querySnapshot) => {
          const groupsData = [];
          querySnapshot.forEach((doc) => {
            groupsData.push({ id: doc.id, ...doc.data() });
          });
          setGroups(groupsData);
        }, (error) => {
          console.error("Erro no listener de grupos: ", error); // O erro que você está vendo
        });

        // Listener para buscar o perfil do usuário
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setCurrentUserProfile(doc.data());
          }
          setLoading(false); // Consideramos carregado após buscar o perfil
        }, (error) => {
          console.error("Erro no listener de perfil: ", error);
          setLoading(false);
        });

      } else {
        // Se o usuário deslogar, limpa todos os dados
        setGroups([]);
        setCurrentUserProfile(null);
        setLoading(false);
      }
    });

    // Função de limpeza principal: desliga tudo quando o app é fechado
    return () => {
      unsubscribeAuth();
      unsubscribeGroups();
      unsubscribeProfile();
    };
  }, []);

  // Função para adicionar um novo grupo com membros
  const addGroup = async (groupName, members = []) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        members: members.length > 1 ? members : [user.uid],
        lastMessage: 'Grupo criado. Diga olá!',
        avatar: `https://ui-avatars.com/api/?name=${groupName.charAt(0)}&background=random`,
      });
    } catch (error) {
      console.error("Erro ao adicionar grupo: ", error);
    }
  };

  // Função para excluir um grupo
  const deleteGroup = async (groupId) => {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (error) {
      console.error("Erro ao excluir grupo: ", error);
    }
  };

  // Função para atualizar um grupo
  const updateGroup = async (groupId, newData) => {
    const groupDocRef = doc(db, 'groups', groupId);
    try {
      await updateDoc(groupDocRef, newData);
    } catch (error) {
      console.error("Erro ao atualizar grupo: ", error);
    }
  };

  return (
    <GroupsContext.Provider value={{ groups, addGroup, deleteGroup, updateGroup, loading, currentUserProfile }}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  return useContext(GroupsContext);
};