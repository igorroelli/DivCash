import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useGroups } from './GroupsContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddExpenseScreen({ route, navigation }) {
  const { group } = route.params;
  const { currentUserProfile } = useGroups();
  
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Busca os perfis completos de cada membro do grupo
  useEffect(() => {
    const fetchMemberProfiles = async () => {
      const memberProfilePromises = group.members.map(memberId => 
        getDoc(doc(db, 'users', memberId))
      );
      const memberDocs = await Promise.all(memberProfilePromises);
      const profiles = memberDocs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setMembers(profiles);
      // Por padrão, todos os membros do grupo são selecionados para a despesa
      setParticipants(profiles.map(p => p.id)); 
      setLoading(false);
    };

    fetchMemberProfiles();
  }, [group.id]);

  // Adiciona ou remove um participante da lista de seleção
  const toggleParticipant = (memberId) => {
    if (participants.includes(memberId)) {
      setParticipants(participants.filter(id => id !== memberId));
    } else {
      setParticipants([...participants, memberId]);
    }
  };

  const handleSaveExpense = async () => {
    // Validação dos campos
    const amount = parseFloat(totalAmount.replace(',', '.')); // Aceita vírgula e ponto
    if (!description || !totalAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e um valor numérico válido.');
      return;
    }
    if (participants.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um participante para a divisão.');
      return;
    }

    setIsSaving(true);
    const amountPerPerson = amount / participants.length;
    
    // Prepara o array de participantes com os detalhes da dívida
    const participantsData = members
      .filter(m => participants.includes(m.id))
      .map(member => ({
        uid: member.uid,
        nickname: member.nickname,
        amountOwed: amountPerPerson,
        status: member.uid === auth.currentUser.uid ? 'paid' : 'unpaid', // Quem pagou já está 'pago'
      }));

    try {
      // Salva a despesa na sub-coleção 'expenses'
      const expensesRef = collection(db, 'groups', group.id, 'expenses');
      await addDoc(expensesRef, {
        description: description.trim(),
        totalAmount: amount,
        payerId: auth.currentUser.uid,
        payerNickname: currentUserProfile.nickname,
        createdAt: serverTimestamp(),
        participants: participantsData,
      });

      // Atualiza a última mensagem do grupo para notificar sobre a despesa
      const groupDocRef = doc(db, 'groups', group.id);
      await updateDoc(groupDocRef, {
        lastMessage: `${currentUserProfile.nickname} adicionou uma despesa: ${description.trim()}`
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.label}>Descrição da Despesa</Text>
      <TextInput style={styles.input} placeholder="Ex: Jantar de sexta" value={description} onChangeText={setDescription} />
      
      <Text style={styles.label}>Valor Total (R$)</Text>
      <TextInput style={styles.input} placeholder="Ex: 50,00" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />
      
      <Text style={styles.subtitle}>Dividir com:</Text>
      {members.map(item => (
        <TouchableOpacity key={item.id} style={styles.memberItem} onPress={() => toggleParticipant(item.id)}>
          <Text style={styles.memberName}>{item.nickname}</Text>
          <MaterialIcons 
            name={participants.includes(item.id) ? "check-box" : "check-box-outline-blank"}
            size={24} 
            color="#4CAF50"
          />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={[styles.button, isSaving && styles.disabledButton]} 
        onPress={handleSaveExpense}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar Despesa</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  memberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16 },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#a5d6a7' },
});