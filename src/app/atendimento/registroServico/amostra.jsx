import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SegmentedButtons } from "react-native-paper";
import { router } from "expo-router";
import Button from "@root/components/_default/button/Button";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import { MaterialIcons } from "@expo/vector-icons";
import { black, errorColor, primariaClara, primaryColor, white } from "@root/components/_default/colors";
import useVisitaStore from "@root/context/visitaContext";
import { findAmostraByIdVisita } from "@root/db/visitaPersistence";

export default function RegistrarAmostras() {
  const { visita, updateVisita } = useVisitaStore();
  const [segmentedValue, setSegmentedValue] = useState(visita.contemAmostra ? "sim" : "não");
  const [initialSample, setInitialSample] = useState(visita.amostra.numeroInicio);
  const [finalSample, setFinalSample] = useState(visita.amostra.numeroFinal);
  const [tubitosQuantity, setTubitosQuantity] = useState(visita.amostra.quantidade);
  const [images, setImages] = useState(visita.amostra.imagens);

  useEffect(() => {
    updateVisita({
      amostra: {
        numeroInicio: initialSample ? initialSample : 0,
        numeroFinal: finalSample ? finalSample : 0,
        quantidade: tubitosQuantity ? tubitosQuantity : 0,
        imagens: images,
      },
    });
  }, [initialSample, finalSample, tubitosQuantity, images, updateVisita]);

  useEffect(()=>{
    async function buscarAmostra(){
      const result = await findAmostraByIdVisita(visita.id);
      if(result){
        setInitialSample(result.numeroInicio)
        setFinalSample(result.numeroFinal)
        setTubitosQuantity(result.quantidade)
      }
    }
    buscarAmostra();
  },[])

  const handleDeleteImage = (id) => {
    const updatedImages = images.filter((image) => image.id !== id);
    setImages(updatedImages);
  };

  const addImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permissão necessária", "Precisamos de permissão para acessar sua câmera.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const newImage = {
        id: Date.now().toString(),
        name: `Nova amostra ${images.length + 1}`,
        description: `Descrição da amostra ${images.length + 1}`,
        uri: pickerResult.assets[0].uri,
      };
      setImages([...images, newImage]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Registrar Amostras</Text>
        <View style={styles.containerForm}>
          <InputTextForm
            label={"Número inicial da amostra"}
            placeholder={"Digite o número inicial"}
            value={initialSample+""}
            onChangeText={setInitialSample}
            style={[styles.input, styles.spaceComponents]}
          />
          <InputTextForm
            label={"Número final da amostra"}
            placeholder={"Digite o número final"}
            value={finalSample+""}
            onChangeText={setFinalSample}
            style={[styles.input, styles.spaceComponents]}
          />
          <InputTextForm
            label={"Quantidade de tubitos"}
            placeholder={"Digite a quantidade de tubitos"}
            value={tubitosQuantity+""}
            onChangeText={setTubitosQuantity}
            style={[styles.input, styles.spaceComponents]}
          />
        </View>
      </ScrollView>
      <Button
        title="Continuar"
        styleLabel={styles.continueButton}
        styleText={{ color: white }}
        onPress={() => router.navigate("atendimento/registroServico/tratamento")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: white,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
    marginVertical: 20,
    textAlign: "center",
  },
  containerForm: {
    backgroundColor: white,
  },
  input: {
    width: 350,
  },
  spaceComponents: {
    marginVertical: 8,
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    width: 350,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  imageInfo: {
    flex: 1,
  },
  imageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
  },
  imageDescription: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
    width: 30,
    height: 30,
    margin: 20,
    backgroundColor: errorColor,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    color: white,
    fontSize: 10,
    fontWeight: "bold",
  },
  addImageButtonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 250,
    height: 50,
    backgroundColor: primariaClara,
    borderRadius: 10,
    shadowColor: black,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
  },
  addImageButtonText: {
    color: black,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  continueButton: {
    width: 350,
    height: 50,
    backgroundColor: primaryColor,
    marginVertical: 20,
  },
});
