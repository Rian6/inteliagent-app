import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { FontAwesome as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ProfilePicture = ({onImageSelected}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  useEffect(()=>{
    if(status && !status.granted){
      requestPermission()
    }
  },[])

  const handleEdit = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      onImageSelected(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={imageUri ? { uri: imageUri } : require('../../../assets/images/perfil.png')} // Imagem padrão
        style={styles.profileImage}
      />
      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <Icon name="pencil" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff', // Cor da borda
  },
  editButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
    borderRadius: 20,
    padding: 5,
  },
});

export default ProfilePicture;
