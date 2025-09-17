import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Modal } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useGroups } from './GroupsContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from './utils/cloudinaryUploader';
import { pickImageFromLibrary, takePhotoWithCamera } from './utils/imagePickerHelper';

const StandardExpenseForm = ({ description, setDescription, totalAmount, setTotalAmount }) => (
  <>
    <Text style={styles.label}>Descrição da Despesa</Text>
    <TextInput style={styles.input} placeholder="Ex: Jantar de sexta" value={description} onChangeText={setDescription} />
    <Text style={styles.label}>Valor Total (R$)</Text>
    <TextInput style={styles.input} placeholder="Ex: 50,00" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />
  </>
);

const CarExpenseForm = ({ distance, pricePerLiter, setPricePerLiter, kmPerLiter, setKmPerLiter, onCalculate, startAddress, setStartAddress, endAddress, setEndAddress, isCalculating, onShowRoute, routeAvailable, tollCost, tollCount }) => (
  <>
    <Text style={styles.label}>Ponto de Partida</Text>
    <TextInput style={styles.input} placeholder="Endereço completo, cidade e estado" value={startAddress} onChangeText={setStartAddress} />
    <Text style={styles.label}>Ponto de Destino</Text>
    <TextInput style={styles.input} placeholder="Endereço completo, cidade e estado" value={endAddress} onChangeText={setEndAddress} />
    <TouchableOpacity style={[styles.button, styles.calculateButton]} onPress={onCalculate} disabled={isCalculating}>
      {isCalculating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Calcular Rota</Text>}
    </TouchableOpacity>
    {routeAvailable && (
      <TouchableOpacity style={[styles.button, styles.routeButton]} onPress={onShowRoute}>
        <Text style={styles.buttonText}>Ver Rota no Mapa</Text>
      </TouchableOpacity>
    )}
    <Text style={styles.label}>Distância Calculada (km)</Text>
    <TextInput style={[styles.input, styles.disabledInput]} value={distance} keyboardType="numeric" editable={false} placeholder="Calculado automaticamente" />
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
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const memberProfilePromises = group.members.map(memberId => getDoc(doc(db, 'users', memberId)));
        const memberDocs = await Promise.all(memberProfilePromises);
        const profiles = memberDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(profiles);
        setParticipants(profiles.map(p => p.id));
      } catch (error) { console.error("Erro ao buscar perfis:", error); }
      finally { setLoading(false); }
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
  
  const calculateRoute = async () => {
    if (!startAddress.trim() || !endAddress.trim()) {
      Alert.alert("Campos Vazios", "Por favor, preencha os pontos de partida e destino.");
      return;
    }
    setIsCalculating(true);
    setDistance(''); setRouteCoordinates(null);
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      Alert.alert("Erro de Configuração", "Chave da API do Google Maps não encontrada.");
      setIsCalculating(false);
      return;
    }
    const origin = encodeURIComponent(startAddress);
    const destination = encodeURIComponent(endAddress);
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${googleApiKey}`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === 'OK' && json.routes.length > 0) {
        const route = json.routes[0];
        const meters = route.legs[0].distance.value;
        const kilometers = (meters / 1000).toFixed(2);
        const polyline = route.overview_polyline.points;
        setDistance(kilometers.toString());
        setRouteCoordinates(polyline);
      } else {
        Alert.alert("Erro ao Calcular", `Não foi possível encontrar uma rota. Status: ${json.status}. ${json.error_message || 'Verifique os endereços.'}`);
      }
    } catch (error) {
      console.error("Erro no cálculo da rota:", error);
      Alert.alert("Erro de Rede", "Ocorreu um problema ao calcular a distância.");
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handlePickReceipt = () => {
    Alert.alert("Adicionar Recibo", "Escolha uma opção",
      [
        { text: "Tirar Foto", onPress: async () => {
            const uri = await takePhotoWithCamera();
            if (uri) setReceiptImage(uri);
        }},
        { text: "Escolher da Galeria", onPress: async () => {
            const uri = await pickImageFromLibrary();
            if (uri) setReceiptImage(uri);
        }},
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };
  
  const handleSaveExpense = async () => {
    let finalAmount = 0;
    let finalDescription = '';
    
    if (expenseType === 'padrão') {
      finalAmount = parseFloat(totalAmount.replace(',', '.'));
      finalDescription = description.trim();
      if (!finalDescription || isNaN(finalAmount) || finalAmount <= 0) {
        Alert.alert('Erro', 'Preencha a descrição e um valor válido.');
        return;
      }
    } else {
      const dist = parseFloat(distance.replace(',', '.'));
      const price = parseFloat(pricePerLiter.replace(',', '.'));
      const consumption = parseFloat(kmPerLiter.replace(',', '.'));
      if (isNaN(dist) || isNaN(price) || isNaN(consumption) || dist <= 0 || price <= 0 || consumption <= 0) {
        Alert.alert('Erro', 'Preencha todos os campos do carro com valores válidos.');
        return;
      }
      finalAmount = (dist / consumption) * price;
      finalDescription = `Viagem de carro (${dist} km)`;
    }

    if (participants.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um participante.');
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
      let receiptUrl = null;
      if (receiptImage) {
        receiptUrl = await uploadImageToCloudinary(receiptImage);
      }
      const expenseData = {
        description: finalDescription, totalAmount: finalAmount, payerId: auth.currentUser.uid, payerNickname: currentUserProfile.nickname,
        createdAt: serverTimestamp(), participants: participantsData, type: expenseType, receiptUrl: receiptUrl,
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
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Image source={{ uri: receiptImage }} style={styles.modalImage} resizeMode="contain" />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => {
                setIsModalVisible(false);
                setTimeout(() => handlePickReceipt(), 100);
              }}
            >
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Trocar Recibo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity style={[styles.typeButton, expenseType === 'padrão' && styles.selectedTypeButton]} onPress={() => setExpenseType('padrão')}><Text style={[styles.typeButtonText, expenseType === 'padrão' && styles.selectedTypeText]}>Padrão</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.typeButton, expenseType === 'carro' && styles.selectedTypeButton]} onPress={() => setExpenseType('carro')}><Text style={[styles.typeButtonText, expenseType === 'carro' && styles.selectedTypeText]}>Carro</Text></TouchableOpacity>
      </View>
      {expenseType === 'padrão' ? (
        <StandardExpenseForm {...{description, setDescription, totalAmount, setTotalAmount}} />
      ) : (
        <CarExpenseForm {...{distance, pricePerLiter, setPricePerLiter, kmPerLiter, setKmPerLiter, onCalculate: calculateRoute, startAddress, setStartAddress, endAddress, setEndAddress, isCalculating, onShowRoute: () => navigation.navigate('RouteMap', { routeCoordinates, startAddress, endAddress }), routeAvailable: !!routeCoordinates}} />
      )}
      <Text style={styles.label}>Recibo (Opcional)</Text>
      <TouchableOpacity 
        style={styles.receiptButton} 
        onPress={() => {
          if (receiptImage) {
            setIsModalVisible(true);
          } else {
            handlePickReceipt();
          }
        }}
      >
        {receiptImage ? (
          <Image source={{ uri: receiptImage }} style={styles.receiptThumbnail} />
        ) : (
          <>
            <MaterialIcons name="add-photo-alternate" size={24} color="#555" />
            <Text style={styles.receiptButtonText}>Adicionar Recibo</Text>
          </>
        )}
      </TouchableOpacity>
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
  calculateButton: { backgroundColor: '#2196F3', marginTop: 0, height: 40, marginBottom: 10 },
  routeButton: { backgroundColor: '#673AB7', marginTop: -10, height: 40 },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#888' },
  receiptButton: { width: '100%', height: 60, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: 20 },
  receiptButtonText: { marginLeft: 10, fontSize: 16, color: '#555' },
  receiptThumbnail: { width: '100%', height: '100%', borderRadius: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 15, padding: 20, alignItems: 'center' },
  modalImage: { width: '100%', height: 400, marginBottom: 20 },
  modalButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});