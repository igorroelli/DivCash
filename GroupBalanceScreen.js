import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

// Componente para renderizar cada despesa individual no histórico
const ExpenseItem = ({ item, onDelete }) => {
  const currentUser = auth.currentUser;
  const debtors = item.participants.filter(p => p.status === 'unpaid' && p.uid !== item.payerId);

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={styles.description}>{item.description}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.amount}>R$ {item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}</Text>
          {currentUser.uid === item.payerId && (
            <TouchableOpacity onPress={() => onDelete(item.id, item.description)} style={{ marginLeft: 10 }}>
              <MaterialIcons name="delete-outline" size={24} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.paidBy}>Pago por: {item.payerNickname}</Text>
      {debtors.length > 0 && (
        <View style={styles.debtorsContainer}>
          <Text style={styles.debtorsTitle}>Devedores nesta despesa:</Text>
          {debtors.map(debtor => (
            <Text key={debtor.uid} style={styles.debtorName}>- {debtor.nickname} (R$ {debtor.amountOwed.toFixed(2)})</Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Componente para o Balanço Detalhado de cada membro
const MemberBalanceDetail = ({ member }) => {
  const debtsToPay = member.debts.filter(d => d.amount > 0);
  const creditsToReceive = member.credits.filter(c => c.amount > 0);

  return (
    <View style={styles.balanceDetailItem}>
      <Text style={styles.balanceNickname}>{member.nickname}</Text>
      {creditsToReceive.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.positiveBalance}>A receber:</Text>
          {creditsToReceive.map(credit => (
            <Text key={credit.from} style={styles.detailText}>
              - R$ {credit.amount.toFixed(2)} de <Text style={styles.personName}>{credit.from}</Text>
            </Text>
          ))}
        </View>
      )}
      {debtsToPay.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.negativeBalance}>A pagar:</Text>
          {debtsToPay.map(debt => (
            <Text key={debt.to} style={styles.detailText}>
              - R$ {debt.amount.toFixed(2)} para <Text style={styles.personName}>{debt.to}</Text>
            </Text>
          ))}
        </View>
      )}
      {debtsToPay.length === 0 && creditsToReceive.length === 0 && (
        <Text style={styles.detailText}>Está quite.</Text>
      )}
    </View>
  );
};

export default function GroupBalanceScreen({ route }) {
  const { groupId } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailedBalances, setDetailedBalances] = useState([]);

  const handleDeleteExpense = (expenseId, description) => {
    Alert.alert(
      "Excluir Despesa",
      `Você tem certeza que deseja excluir a despesa "${description}"? Esta ação recalculará o balanço do grupo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const expenseRef = doc(db, 'groups', groupId, 'expenses', expenseId);
            try {
              await deleteDoc(expenseRef);
            } catch (error) {
              console.error("Erro ao excluir despesa: ", error);
              Alert.alert("Erro", "Não foi possível excluir a despesa.");
            }
          }
        }
      ]
    );
  };
  
  useEffect(() => {
    if (!groupId) return;
    const expensesRef = collection(db, 'groups', groupId, 'expenses');
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const expensesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesList);

      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) { setLoading(false); return; }
      const memberIds = groupDoc.data().members;
      const memberProfiles = {};
      const matrix = {};
      const profilePromises = memberIds.map(id => getDoc(doc(db, 'users', id)));
      const profileDocs = await Promise.all(profilePromises);
      
      profileDocs.forEach(doc => {
        if (doc.exists()) {
          memberProfiles[doc.id] = doc.data();
          matrix[doc.id] = {};
        }
      });
      
      expensesList.forEach(expense => {
        const payerId = expense.payerId;
        const participants = expense.participants;
        if (!participants || participants.length === 0) return;
        const amountPerPerson = expense.totalAmount / participants.length;
        participants.forEach(participant => {
          const debtorId = participant.uid;
          if (payerId !== debtorId) {
            if (!matrix[debtorId]) matrix[debtorId] = {};
            if (!matrix[payerId]) matrix[payerId] = {};
            if (!matrix[debtorId][payerId]) matrix[debtorId][payerId] = 0;
            if (!matrix[payerId][debtorId]) matrix[payerId][debtorId] = 0;
            matrix[debtorId][payerId] += amountPerPerson;
          }
        });
      });

      for (const p1 of memberIds) {
        for (const p2 of memberIds) {
          if (p1 !== p2 && matrix[p1]?.[p2] && matrix[p2]?.[p1]) {
            const amount = Math.min(matrix[p1][p2], matrix[p2][p1]);
            matrix[p1][p2] -= amount;
            matrix[p2][p1] -= amount;
          }
        }
      }

      const detailedBalanceList = [];
      for (const uid of memberIds) {
        const memberData = { uid, nickname: memberProfiles[uid]?.nickname || 'Usuário', debts: [], credits: [] };
        for (const otherUid of memberIds) {
          if (uid !== otherUid) {
            const debtAmount = matrix[uid]?.[otherUid] || 0;
            if (debtAmount > 0.01) memberData.debts.push({ to: memberProfiles[otherUid]?.nickname, amount: debtAmount });
            const creditAmount = matrix[otherUid]?.[uid] || 0;
            if (creditAmount > 0.01) memberData.credits.push({ from: memberProfiles[otherUid]?.nickname, amount: creditAmount });
          }
        }
        detailedBalanceList.push(memberData);
      }
      setDetailedBalances(detailedBalanceList);
      setLoading(false);

    }, (error) => {
      console.error("Erro ao buscar despesas: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Balanço Detalhado</Text>
      <View style={styles.balanceContainer}>
        {detailedBalances.map(member => (
          <MemberBalanceDetail key={member.uid} member={member} />
        ))}
      </View>
      
      <Text style={styles.title}>Histórico de Despesas</Text>
      {expenses.length > 0 ? (
        expenses.map(item => <ExpenseItem key={item.id} item={item} onDelete={handleDeleteExpense} />)
      ) : (
        <Text style={styles.emptyText}>Nenhuma despesa registrada.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, marginTop: 10, textAlign: 'center' },
  balanceContainer: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  personName: { fontWeight: 'bold' },
  expenseItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  description: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  amount: { fontSize: 16, color: '#333' },
  paidBy: { fontSize: 12, color: 'gray', marginTop: 4 },
  debtorsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  debtorsTitle: { fontSize: 12, fontWeight: 'bold', color: 'gray' },
  debtorName: { fontSize: 12, color: 'gray', marginLeft: 10 },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20, padding: 20 },
  balanceDetailItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  balanceNickname: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detailSection: { marginTop: 5, paddingLeft: 10 },
  positiveBalance: { color: '#4CAF50', fontWeight: 'bold', marginBottom: 4 },
  negativeBalance: { color: '#f44336', fontWeight: 'bold', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#333', lineHeight: 22 },
});