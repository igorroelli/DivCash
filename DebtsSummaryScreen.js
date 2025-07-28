import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';

export default function DebtsSummaryScreen() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const debtsRef = collectionGroup(db, 'debts');
    const q = query(debtsRef, where('membersInvolved', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(allDebts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderDebtItem = ({ item }) => {
    const amIDebtor = !!item.debtors[currentUser.uid];
    const isMyDebtPaid = amIDebtor && item.debtors[currentUser.uid].status === 'paid';
    
    // Se eu sou o pagador
    if (item.payerId === currentUser.uid) {
      // Calcula o total que ainda me devem
      const totalOwedToMe = Object.values(item.debtors)
        .filter(d => d.status === 'unpaid')
        .reduce((sum, d) => sum + d.amountOwed, 0);

      // Se ninguém me deve mais, não mostra nada
      if (totalOwedToMe === 0) return null;

      return (
        <View style={[styles.debtItem, styles.iAmCreditor]}>
          <Text style={styles.description}>Você pagou por "{item.description}"</Text>
          <Text style={styles.amountText}>Ainda te devem R$ {totalOwedToMe.toFixed(2)}</Text>
        </View>
      );
    }
    
    // Se eu sou um devedor e minha parte não foi paga
    if (amIDebtor && !isMyDebtPaid) {
      return (
        <View style={[styles.debtItem, styles.iAmDebtor]}>
          <Text style={styles.description}>"{item.description}" pago por {item.payerNickname}</Text>
          <Text style={styles.amountText}>Você deve R$ {item.amountPerPerson.toFixed(2)}</Text>
        </View>
      );
    }

    return null; // Não mostra dívidas onde sou devedor e já paguei
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
        ListEmptyComponent={<Text style={styles.emptyText}>Você não tem nenhuma dívida pendente.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  debtItem: { padding: 15, marginVertical: 5, marginHorizontal: 10, borderRadius: 8 },
  iAmCreditor: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9' },
  iAmDebtor: { backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#ffcdd2' },
  description: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  amountText: { fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 50, fontSize: 16 },
});