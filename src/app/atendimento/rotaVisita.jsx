import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { FAB } from "react-native-paper";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import {
  black,
  primariaClara,
  primaryColor,
  white,
} from "@root/components/_default/colors";
import Button from "@root/components/_default/button/Button";
import { router, useGlobalSearchParams } from "expo-router";

export default function RotaVisitas() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dataVisita, setDataVisita] = useState([]);
  const [loading, setLoading] = useState(true); // estado para controle de carregamento
  const { rawDataVisita, id } = useGlobalSearchParams();

  const positivoImage = require("../../assets/images/positivo.png");
  const negativoImage = require("../../assets/images/negativo.png");

  const statusMap = {
    1: { label: "Local estava fechado", color: "#FF0000", image: negativoImage },
    2: { label: "Visita Recusada", color: "#FF0000", image: negativoImage },
    3: { label: "Realizada", color: "#4CAF50", image: positivoImage },
    4: { label: "Visita foi rejeitada", color: "#DAA520", image: negativoImage },
    5: { label: "Aberto", color: "#808080", image: negativoImage },
    default: {
      label: "Status Desconhecido",
      color: "#666",
      image: negativoImage,
    },
  };

  const toggleModal = () => setIsModalVisible(!isModalVisible);
  const handleCloseModal = () => setIsModalVisible(false);

  const handleItemPress = (item) => {
    navegarVisita(item.id)
  };

  function navegarVisita(idVisita){
    router.navigate({
      pathname: "atendimento/registroServico",
      params: { idVisita: idVisita, idPlanejamento: id }, 
    });
  }

  const getSequenceLabel = (index) => {
    // Gerar número ou letra para identificação de sequência
    return String.fromCharCode(65 + index); // A, B, C...
    // Para usar números ao invés de letras, basta retornar `index + 1`
  };

  useEffect(() => {
    const parseData = () => {
      if (rawDataVisita) {
        try {
          const parsedData = JSON.parse(rawDataVisita);
          setDataVisita(parsedData);
          setLoading(false); // dados carregados com sucesso
        } catch (error) {
          console.error("Erro ao parsear dataVisita:", error);
          setLoading(false); // mesmo em caso de erro, desativa o carregamento
        }
      }
    };

    parseData();
  }, [rawDataVisita]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: dataVisita[0].latitude,
          longitude: dataVisita[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {dataVisita.map((address, index) => (
          <Marker
            key={address.id}
            coordinate={{
              latitude: address.latitude,
              longitude: address.longitude,
            }}
            title={`${address.title} (${getSequenceLabel(index)})`} // Mostrar o título + sequência
            description={getSequenceLabel(index)} // Adicionar sequência na descrição se necessário
            pinColor={selectedItem?.id === address.id ? primaryColor : "blue"} // Mudar cor ao selecionar
          />
        ))}
      </MapView>

      <FAB
        color={white}
        style={styles.fab}
        icon="format-list-checks"
        onPress={toggleModal}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <PanGestureHandler
          onGestureEvent={({ nativeEvent }) => {
            if (nativeEvent.translationY > 50) {
              handleCloseModal();
            }
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.pullHandle} />
              <Text style={styles.modalTitle}>Sugestão de Rotas</Text>
              <FlatList
                data={dataVisita}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => {
                  const { label, color, image } =
                    statusMap[item.status] || statusMap.default;
                  const isSelected = selectedItem && selectedItem.id === item.id;

                  return (
                    <TouchableOpacity
                      onPress={() => handleItemPress(item)}
                      style={[
                        styles.itemContainer,
                        isSelected && styles.selectedItemContainer,
                      ]}
                    >
                      <Image source={image} style={styles.itemImage} />
                      <View style={styles.textContainer}>
                        <Text
                          style={[
                            styles.itemTitle,
                            isSelected && styles.selectedText,
                          ]}
                        >
                          {getSequenceLabel(index)}. {item.title} {/* Adiciona a sequência */}
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            isSelected ? styles.selectedText : { color },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.flatListContainer}
              />
            </View>
          </View>
        </PanGestureHandler>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  buttonLogin: {
    width: "100%",
    height: 50,
    marginTop: 30,
    backgroudColor: primaryColor,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: primaryColor,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "flex-end",
    maxHeight: "50%",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pullHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  flatListContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
  },
  selectedItemContainer: {
    borderRadius: 10,
    backgroundColor: primaryColor,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  selectedText: {
    color: white,
  },
});
