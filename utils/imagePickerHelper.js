import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const pickImageFromLibrary = async (options = {}) => {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à galeria para escolher uma foto.');
        return null;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      quality: 0.5,
      ...options,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Erro ao abrir a galeria:", error);
    Alert.alert("Erro", "Não foi possível abrir a galeria de imagens.");
    return null;
  }
};

export const takePhotoWithCamera = async (options = {}) => {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
        return null;
      }
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      ...options,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Erro ao abrir a câmera:", error);
    Alert.alert("Erro", "Não foi possível abrir a câmera.");
    return null;
  }
};