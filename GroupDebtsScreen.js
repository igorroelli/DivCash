import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

export default function GroupDebtsScreen({ route, navigation }) {
  const { group } = route.params;
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberProfiles, setMemberProfiles] = useState({});
  const currentUser = auth.currentUser;

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Dívidas de "${group.name}"` });
  }, [navigation, group]);

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      if (!group.members || group.members.length === 0) return;
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', group.members));
      const querySnapshot = await getDocs(q);
      
      const profiles = {};
      querySnapshot.forEach(doc => {
        profiles[doc.id] = doc.data();
      });
      setMemberProfiles(profiles);
    };

    fetchMemberProfiles();

    const debtsRef = collection(db, 'groups', group.id, 'debts');
    const qDebts = query(debtsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(qDebts, (snapshot) => {
      const allDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(allDebts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [group.id]);

  const handleMarkAsPaid = async (debt) => {
    if (debt.payerId !== currentUser.uid) {
      Alert.alert("Ação não permitida", "Apenas quem pagou a conta pode marcá-la como quitada.");
      return;
    }
    
    const updatedDebtors = { ...debt.debtors };
    for (const key in updatedDebtors) {
      updatedDebtors[key].status = 'paid';
    }

    const debtRef = doc(db, 'groups', group.id, 'debts', debt.id);
    try {
      await updateDoc(debtRef, { debtors: updatedDebtors });
      Alert.alert("Sucesso", "Dívida marcada como paga para todos!");
    } catch (error) {
      console.error("Erro ao quitar dívida:", error);
      Alert.alert("Erro", "Não foi possível atualizar a dívida.");
    }
  };

  const handleDeleteDebt = (debt) => {
    Alert.alert(
      "Excluir Dívida",
      `Você tem certeza que deseja excluir a dívida "${debt.description}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const debtRef = doc(db, 'groups', group.id, 'debts', debt.id);
            await deleteDoc(debtRef);
          },
        },
      ]
    );
  };

  const renderDebtItem = ({ item }) => {
    const isPayer = item.payerId === currentUser.uid;
    const amIDebtor = item.debtors && !!item.debtors[currentUser.uid];
    const isFullyPaid = item.debtors && Object.values(item.debtors).every(d => d.status === 'paid');
    const involvedMembersNames = (Array.isArray(item.membersInvolved)) ? item.membersInvolved.map(id => memberProfiles[id]?.nickname || '...').join(', ') : 'N/A';

    return (
      <View style={[styles.debtItem, isFullyPaid && styles.paidItem]}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.payerText}>Criado por: {item.payerNickname}</Text>
        <Text style={styles.membersText}>Dividindo com: {involvedMembersNames}</Text>

        {amIDebtor && (
          <Text style={isFullyPaid ? styles.statusPaidText : styles.statusUnpaidText}>
            Sua parte: R$ {item.amountPerPerson.toFixed(2)} - {isFullyPaid ? 'PAGO' : 'PENDENTE'}
          </Text>
        )}
        
        {isPayer && (
          <View style={styles.actionsContainer}>
            {!isFullyPaid && (
              <TouchableOpacity style={styles.payButton} onPress={() => handleMarkAsPaid(item)}>
                <Text style={styles.actionButtonText}>Marcar como Recebido</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AddDebt', { group, debtToEdit: item })}>
              <MaterialIcons name="edit" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDebt(item)}>
              <MaterialIcons name="delete" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
        
        {isFullyPaid && !isPayer && <Text style={styles.fullyPaidText}>Dívida Quitada</Text>}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        renderItem={renderDebtItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma dívida registrada neste grupo.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDebt', { group })}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  debtItem: { backgroundColor: '#fff', padding: 15, marginVertical: 8, marginHorizontal: 10, borderRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  paidItem: { backgroundColor: '#f1f8e9', borderColor: '#c8e6c9' },
  description: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  payerText: { fontSize: 14, color: 'gray', fontStyle: 'italic' },
  membersText: { fontSize: 14, color: '#333', marginTop: 8, marginBottom: 8 },
  statusUnpaidText: { color: '#f44336', fontWeight: 'bold', fontSize: 16 },
  statusPaidText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  fullyPaidText: { color: '#4CAF50', fontWeight: 'bold', alignSelf: 'flex-end', marginTop: 10 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'flex-end' },
  payButton: { backgroundColor: '#2196F3', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  editButton: { backgroundColor: '#FFA000', padding: 10, borderRadius: 8, marginLeft: 10 },
  deleteButton: { backgroundColor: '#f44336', padding: 10, borderRadius: 8, marginLeft: 10 },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 50, fontSize: 16 },
  fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#4CAF50', borderRadius: 28, elevation: 8 },
});