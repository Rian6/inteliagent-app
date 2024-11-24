import { buscarVisitas } from "@root/db/visitaPersistence";
import { router, useGlobalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList, Pressable } from "react-native";

const positivoImage = require('../../assets/images/positivo.png');
const negativoImage = require('../../assets/images/negativo.png');

// Mapeamento de status para descrição, cor e imagem
const statusMap = {
  1: { label: "Local estava fechado", color: "#FF0000", image: negativoImage }, // Vermelho
  2: { label: "Visita Recusada", color: "#FF0000", image: negativoImage }, // Vermelho
  3: { label: "Realizada", color: "#4CAF50", image: positivoImage }, // Verde
  4: { label: "Visita foi rejeitada", color: "#DAA520", image: negativoImage }, // Amarelo mostarda
  5: { label: "Aberto", color: "#808080", image: negativoImage }, // Cinza
  default: { label: "Status Desconhecido", color: "#666", image: negativoImage }, // Cinza padrão
};

const VisitaList = ({data=[]}) => {
  const { id } = useGlobalSearchParams();
  function navegarVisita(idVisita){
    router.navigate({
      pathname: "atendimento/registroServico",
      params: { idVisita: idVisita, idPlanejamento: id }, 
    });
  }

  const renderItem = ({ item }) => {
    const { label, color, image } = statusMap[item.status] || statusMap.default;

    return (
      <Pressable style={styles.itemContainer} onPress={()=>navegarVisita(item.id)}>
        <Image source={image} style={styles.itemImage} />
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          <Text style={[styles.itemSubtitle, { color }]}>{label}</Text>
        </View>
      </Pressable>
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
