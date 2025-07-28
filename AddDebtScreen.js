import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, where, query, doc, updateDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddDebtScreen({ route, navigation }) {
  const { group, debtToEdit } = route.params;
  const isEditing = !!debtToEdit;

  const [description, setDescription] = useState(debtToEdit?.description || '');
  const [totalAmount, setTotalAmount] = useState(debtToEdit?.totalAmount.toString() || '');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(debtToEdit?.membersInvolved || []);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!group.members || group.members.length === 0) {
        setIsLoading(false);
        return;
      }
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', group.members));
      const querySnapshot = await getDocs(q);
      const memberProfiles = querySnapshot.docs.map(doc => doc.data());
      setMembers(memberProfiles);
      if (!isEditing) {
        setSelectedMembers(group.members);
      }
      setIsLoading(false);
    };
    fetchMembers();
  }, [group.members]);

  const toggleMemberSelection = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter(id => id !== memberId));
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSaveDebt = async () => {
    const amount = parseFloat(totalAmount.replace(',', '.'));
    if (!description.trim() || isNaN(amount) || amount <= 0 || selectedMembers.length === 0) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione pelo menos um membro.');
      return;
    }

    setIsLoading(true);
    const amountPerPerson = amount / selectedMembers.length;
    const debtorsData = selectedMembers.reduce((acc, memberId) => {
      if (memberId !== currentUser.uid) {
        acc[memberId] = { uid: memberId, amountOwed: amountPerPerson, status: 'unpaid' };
      }
      return acc;
    }, {});
    
    try {
      if (isEditing) {
        const debtRef = doc(db, 'groups', group.id, 'debts', debtToEdit.id);
        await updateDoc(debtRef, {
          description: description.trim(),
          totalAmount: amount,
          amountPerPerson: amountPerPerson,
          membersInvolved: selectedMembers,
          debtors: debtorsData,
        });
        Alert.alert('Sucesso!', 'Dívida atualizada.');
      } else {
        const debtsCollectionRef = collection(db, 'groups', group.id, 'debts');
        await addDoc(debtsCollectionRef, {
          description: description.trim(),
          totalAmount: amount,
          amountPerPerson: amountPerPerson,
          payerId: currentUser.uid,
          payerNickname: currentUser.displayName,
          membersInvolved: selectedMembers,
          debtors: debtorsData,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Sucesso!', 'Dívida registrada.');
      }
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar dívida: ", error);
      Alert.alert('Erro', 'Não foi possível salvar a dívida.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const amountPerPerson = selectedMembers.length > 0 ? (parseFloat(totalAmount.replace(',', '.')) || 0) / selectedMembers.length : 0;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{isEditing ? 'Editar Dívida' : 'Dividir Nova Dívida'}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Descrição (ex: Jantar, Gasolina)"
        value={description}
        onChangeText={setDescription}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Valor Total (ex: 50,00)"
        value={totalAmount}
        onChangeText={setTotalAmount}
        keyboardType="numeric"
      />

      <Text style={styles.subtitle}>Dividir com:</Text>
      <View style={styles.list}>
        {members.map((item) => (
          <TouchableOpacity key={item.uid} style={styles.memberItem} onPress={() => toggleMemberSelection(item.uid)}>
            <Text style={styles.memberName}>{item.nickname}</Text>
            <MaterialIcons 
              name={selectedMembers.includes(item.uid) ? "check-box" : "check-box-outline-blank"}
              size={24} 
              color="#4CAF50"
            />
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.resultText}>
        Valor por pessoa: R$ {amountPerPerson.toFixed(2).replace('.', ',')}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSaveDebt}>
        <Text style={styles.buttonText}>{isEditing ? 'Salvar Alterações' : 'Registrar Dívida'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1e1e1e', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  list: { width: '100%', maxHeight: 250, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#fff' },
  memberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16 },
  resultText: { fontSize: 18, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});