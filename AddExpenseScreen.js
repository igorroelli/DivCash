import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useGroups } from './GroupsContext';
import { MaterialIcons } from '@expo/vector-icons';

// --- SOLUÇÃO PARA O BUG DE DIGITAÇÃO ---
// Componentes do formulário são definidos FORA do componente principal
// para evitar que sejam recriados a cada nova letra digitada.

const StandardExpenseForm = ({ description, setDescription, totalAmount, setTotalAmount }) => (
  <>
    <Text style={styles.label}>Descrição da Despesa</Text>
    <TextInput style={styles.input} placeholder="Ex: Jantar de sexta" value={description} onChangeText={setDescription} />
    <Text style={styles.label}>Valor Total (R$)</Text>
    <TextInput style={styles.input} placeholder="Ex: 50,00" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />
  </>
);

const CarExpenseForm = ({ distance, setDistance, pricePerLiter, setPricePerLiter, kmPerLiter, setKmPerLiter }) => (
  <>
    <Text style={styles.label}>Distância Percorrida (km)</Text>
    <TextInput style={styles.input} placeholder="Ex: 150" value={distance} onChangeText={setDistance} keyboardType="numeric" />
    <Text style={styles.label}>Preço por Litro (R$)</Text>
    <TextInput style={styles.input} placeholder="Ex: 5.50" value={pricePerLiter} onChangeText={setPricePerLiter} keyboardType="numeric" />
    <Text style={styles.label}>Consumo do Carro (km/L)</Text>
    <TextInput style={styles.input} placeholder="Ex: 12" value={kmPerLiter} onChangeText={setKmPerLiter} keyboardType="numeric" />
  </>
);

export default function AddExpenseScreen({ route, navigation }) {
  const { group } = route.params;
  const { currentUserProfile } = useGroups();
  
  const [expenseType, setExpenseType] = useState('padrão');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [distance, setDistance] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [kmPerLiter, setKmPerLiter] = useState('');
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      const memberProfilePromises = group.members.map(memberId => getDoc(doc(db, 'users', memberId)));
      const memberDocs = await Promise.all(memberProfilePromises);
      const profiles = memberDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(profiles);
      setParticipants(profiles.map(p => p.id));
      setLoading(false);
    };
    fetchMemberProfiles();
  }, [group.id]);

  const toggleParticipant = (memberId) => {
    if (participants.includes(memberId)) {
      setParticipants(participants.filter(id => id !== memberId));
    } else {
      setParticipants([...participants, memberId]);
    }
  };

  const handleSaveExpense = async () => {
    let finalAmount = 0;
    let finalDescription = '';
    
    if (expenseType === 'padrão') {
      finalAmount = parseFloat(totalAmount.replace(',', '.'));
      finalDescription = description.trim();
      if (!finalDescription || isNaN(finalAmount) || finalAmount <= 0) {
        Alert.alert('Erro', 'Por favor, preencha a descrição e um valor válido.');
        return;
      }
    } else {
      const dist = parseFloat(distance.replace(',', '.'));
      const price = parseFloat(pricePerLiter.replace(',', '.'));
      const consumption = parseFloat(kmPerLiter.replace(',', '.'));
      if (isNaN(dist) || isNaN(price) || isNaN(consumption) || dist <= 0 || price <= 0 || consumption <= 0) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos do carro com valores numéricos válidos.');
        return;
      }
      finalAmount = (dist / consumption) * price;
      finalDescription = `Viagem de carro (${dist} km)`;
    }

    if (participants.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um participante para a divisão.');
      return;
    }

    setIsSaving(true);
    const amountPerPerson = finalAmount / participants.length;
    
    const participantsData = members
      .filter(m => participants.includes(m.id))
      .map(member => ({
        uid: member.uid, nickname: member.nickname, amountOwed: amountPerPerson, status: member.uid === auth.currentUser.uid ? 'paid' : 'unpaid',
      }));

    try {
      const expenseData = {
        description: finalDescription, totalAmount: finalAmount, payerId: auth.currentUser.uid, payerNickname: currentUserProfile.nickname,
        createdAt: serverTimestamp(), participants: participantsData, type: expenseType,
      };
      if (expenseType === 'carro') {
        expenseData.distance = parseFloat(distance.replace(',', '.'));
        expenseData.pricePerLiter = parseFloat(pricePerLiter.replace(',', '.'));
        expenseData.kmPerLiter = parseFloat(kmPerLiter.replace(',', '.'));
      }
      const expensesRef = collection(db, 'groups', group.id, 'expenses');
      await addDoc(expensesRef, expenseData);
      const groupDocRef = doc(db, 'groups', group.id);
      await updateDoc(groupDocRef, { lastMessage: `${currentUserProfile.nickname} adicionou uma despesa: ${finalDescription}` });
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity style={[styles.typeButton, expenseType === 'padrão' && styles.selectedTypeButton]} onPress={() => setExpenseType('padrão')}>
          <Text style={[styles.typeButtonText, expenseType === 'padrão' && styles.selectedTypeText]}>Padrão</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeButton, expenseType === 'carro' && styles.selectedTypeButton]} onPress={() => setExpenseType('carro')}>
          <Text style={[styles.typeButtonText, expenseType === 'carro' && styles.selectedTypeText]}>Carro</Text>
        </TouchableOpacity>
      </View>

      {expenseType === 'padrão' ? (
        <StandardExpenseForm description={description} setDescription={setDescription} totalAmount={totalAmount} setTotalAmount={setTotalAmount} />
      ) : (
        <CarExpenseForm distance={distance} setDistance={setDistance} pricePerLiter={pricePerLiter} setPricePerLiter={setPricePerLiter} kmPerLiter={kmPerLiter} setKmPerLiter={setKmPerLiter} />
      )}
      
      <Text style={styles.subtitle}>Dividir com:</Text>
      {members.map(item => (
        <TouchableOpacity key={item.id} style={styles.memberItem} onPress={() => toggleParticipant(item.id)}>
          <Text style={styles.memberName}>{item.nickname}</Text>
          <MaterialIcons name={participants.includes(item.id) ? "check-box" : "check-box-outline-blank"} size={24} color="#4CAF50" />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity style={[styles.button, isSaving && styles.disabledButton]} onPress={handleSaveExpense} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar Despesa</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  typeSelectorContainer: { flexDirection: 'row', width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#4CAF50', borderRadius: 12, overflow: 'hidden' },
  typeButton: { flex: 1, padding: 12, alignItems: 'center' },
  selectedTypeButton: { backgroundColor: '#4CAF50' },
  typeButtonText: { fontSize: 16, color: '#4CAF50' },
  selectedTypeText: { color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8, alignSelf: 'flex-start' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  memberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16 },
  button: { width: '100%', height: 50, backgroundColor: '#4CAF50', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#a5d6a7' },
});