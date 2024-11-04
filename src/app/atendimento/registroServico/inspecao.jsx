import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text, Image } from "react-native";
import { Checkbox } from "react-native-paper";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";

const items = [
  { id: "1", title: "A1", subtitle: "Caixa d\´agua (elevado)", image: require("../../../assets/images/inspecao/A1.png") },
  { id: "2", title: "A2", subtitle: "Outros depositos de armazenamento de água (Baixo)", image: require("../../../assets/images/inspecao/A2.png") },
  { id: "3", title: "B", subtitle: "Pequenos depositos Móveis", image: require("../../../assets/images/inspecao/B.png") },
  { id: "4", title: "C", subtitle: "Depositos fixos", image: require("../../../assets/images/inspecao/C.png") },
  { id: "5", title: "D1", subtitle: "Pneus e outros materiais rodantes", image: require("../../../assets/images/inspecao/D1.png") },
  { id: "6", title: "D2", subtitle: "Lixo (recipientes plásticos, latas) sucatas, entulhos", image: require("../../../assets/images/inspecao/D2.png") },
  { id: "7", title: "E", subtitle: "Depósitos naturais", image: require("../../../assets/images/inspecao/E.png") },

];

const ItemWithCheckbox = ({ item, onToggle, checked }) => (
  <View style={styles.itemContainer}>
    <Image source={item.image} style={styles.image} />
    <View style={styles.textContainer}>
      <Text style={styles.itemText}>{item.title}</Text>
      <Text style={styles.updateText}>{item.subtitle}</Text>
    </View>
    <Checkbox
      status={checked ? "checked" : "unchecked"}
      onPress={() => onToggle(item.id)}
      style={styles.checkbox}
      color={primaryColor}
    />
  </View>
);

export default function Inspecao() {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCheckbox = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((item) => item !== id) : [...prevSelected, id]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerForm}>
        <Text style={styles.instructions}>Selecione os itens que foram inspecionados</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemWithCheckbox
              item={item}
              onToggle={toggleCheckbox}
              checked={selectedItems.includes(item.id)}
            />
          )}
        />
      </View>
      <Button
        title={"Continuar"}
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={() => router.navigate("atendimento/visitas")}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroundColor: primaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  containerForm: {
    margin: 30,
    backgroundColor: white,
    width: "90%",
  },
  instructions: {
    fontSize: 16,
    color: black,
    marginBottom: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  updateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  checkbox: {
    alignSelf: "center",
  },
});