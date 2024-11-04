import React from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";

const positivoImage = require('../../assets/images/positivo.png');
const negativoImage = require('../../assets/images/negativo.png');

const data = [
  {
    id: "1",
    title: "Avenida Sabiá 1638",
    status: 1, // Local estava fechado
  },
  {
    id: "2",
    title: "Rua dos Pardais, 580",
    status: 2, // Visita Recusada
  },
  {
    id: "3",
    title: "Rua das Perdizes, 45",
    status: 3, // Realizada
  },
  {
    id: "4",
    title: "Avenida Primavera, 200",
    status: 4, // Visita foi rejeitada
  },
  {
    id: "5",
    title: "Rua das Palmeiras, 101",
    status: 5, // Aberto
  },
  {
    id: "6",
    title: "Rua das Palmeiras, 101",
    status: 5, // Aberto
  },
  {
    id: "7",
    title: "Rua das Palmeiras, 101",
    status: 5, // Aberto
  },
  {
    id: "8",
    title: "Rua das Palmeiras, 101",
    status: 5, // Aberto
  },
  {
    id: "9",
    title: "Rua das Palmeiras, 101",
    status: 5, // Aberto
  },
];

// Mapeamento de status para descrição, cor e imagem
const statusMap = {
  1: { label: "Local estava fechado", color: "#FF0000", image: negativoImage }, // Vermelho
  2: { label: "Visita Recusada", color: "#FF0000", image: negativoImage }, // Vermelho
  3: { label: "Realizada", color: "#4CAF50", image: positivoImage }, // Verde
  4: { label: "Visita foi rejeitada", color: "#DAA520", image: negativoImage }, // Amarelo mostarda
  5: { label: "Aberto", color: "#808080", image: negativoImage }, // Cinza
  default: { label: "Status Desconhecido", color: "#666", image: negativoImage }, // Cinza padrão
};

const VisitaList = () => {
  const renderItem = ({ item }) => {
    const { label, color, image } = statusMap[item.status] || statusMap.default;

    return (
      <View style={styles.itemContainer}>
        <Image source={image} style={styles.itemImage} />
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={[styles.itemSubtitle, { color }]}>{label}</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
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
    color: "#333",
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default VisitaList;
