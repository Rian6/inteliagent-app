import React, { useState } from "react";
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
import { FAB } from "react-native-paper"; // ajuste conforme seu pacote de FAB
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

const positivoImage = require("../../assets/images/positivo.png");
const negativoImage = require("../../assets/images/negativo.png");

const data = [
  {
    id: "1",
    title: "Avenida Sabiá 1638",
    status: 1,
    latitude: -23.56399,
    longitude: -46.65398,
  },
  {
    id: "2",
    title: "Rua dos Pardais, 580",
    status: 2,
    latitude: -23.56601,
    longitude: -46.65157,
  },
  {
    id: "3",
    title: "Rua das Perdizes, 45",
    status: 3,
    latitude: -23.5632,
    longitude: -46.6573,
  },
  {
    id: "4",
    title: "Avenida Primavera, 200",
    status: 4,
    latitude: -23.564,
    longitude: -46.655,
  },
  {
    id: "5",
    title: "Rua das Palmeiras, 101",
    status: 5,
    latitude: -23.565,
    longitude: -46.6545,
  },
];

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

const RotaVisitas = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleModal = () => setIsModalVisible(!isModalVisible);
  const handleCloseModal = () => setIsModalVisible(false);

  const handleItemPress = (item) => {
    if (selectedItem && selectedItem.id === item.id) {
      // Desseleciona o item se já estiver selecionado
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setSelectedLocation({
        latitude: item.latitude,
        longitude: item.longitude,
      });
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: -23.56399,
          longitude: -46.65398,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {data.map((address) => (
          <Marker
            key={address.id}
            coordinate={{
              latitude: address.latitude,
              longitude: address.longitude,
            }}
            title={address.title}
          />
        ))}
      </MapView>

      {/* Usando o componente FAB adequado */}
      <FAB
        color={white}
        style={styles.fab}
        icon="format-list-checks" // Ou você pode usar o FontAwesome se preferir
        onPress={toggleModal}
      />

      {/* Modal de Listagem */}
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
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const { label, color, image } =
                    statusMap[item.status] || statusMap.default;
                  const isSelected =
                    selectedItem && selectedItem.id === item.id;

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
                          {item.title}
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
              <Button
                title="Realizar Visita"
                onPress={handleCloseModal}
                styleLabel={styles.buttonLogin}
                styleText={{ color: white }}
                disabled={!selectedItem}
              />
            </View>
          </View>
        </PanGestureHandler>
      </Modal>
    </GestureHandlerRootView>
  );
};

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
    backgroundColor: primaryColor, // Muda o fundo para a cor primária
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
    color: white, // Muda a cor do texto para branco quando selecionado
  },
  visitButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
    backgroundColor: primaryColor,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5, // Faz o botão parecer desabilitado
  },
  visitButtonText: {
    color: white,
    fontSize: 16,
  },
});

export default RotaVisitas;
