import {
  primariaClara,
  primaryColor,
  white,
} from "@root/components/_default/colors";
import { View, StyleSheet, Text } from "react-native";
import { FAB, PaperProvider, Portal, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou de react-native-vector-icons
import VisitaList from "@root/components/visitas/VisitaList";
import React, { useState } from "react";
import { router } from "expo-router";

export default function DadosGerais() {
  const [state, setState] = React.useState({ open: false });

  const onStateChange = ({ open }) => setState({ open });
  const { open } = state;

  function vizualizarRotas() {
    router.navigate("atendimento/rotaVisita");
  }
  function adicionarVisita() {
    router.navigate("atendimento/registroServico");
  }

  return (
    <View style={styles.container}>
      <View style={styles.containerTop}>
        <Searchbar
          style={styles.searchInput}
          icon={() => (
            <MaterialCommunityIcons name="menu" size={24} color="black" />
          )}
          clearIcon={() => (
            <MaterialCommunityIcons
              name="text-box-search-outline"
              size={24}
              color="black"
            />
          )}
          placeholder="Pesquise suas Visitas"
        />
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          Ordem das Visitas
        </Text>
        <Text style={{ fontSize: 14, textAlign: "center" }}>
          As visitas estão ordenadas de cima para baixo em uma rota otimizada
          para o seu melhor desempenho.
        </Text>
      </View>
      <VisitaList />
      <FAB.Group
        icon={open ? "close" : "plus"}
        fabStyle={styles.fabContainer}
        color={white}
        open={open}
        delayLongPress={200}
        visible
        actions={[
          {
            icon: "google-maps",
            label: "Vizualizar Rota",
            color: primaryColor,
            rippleColor: primariaClara,
            onPress: () => vizualizarRotas(),
          },
          {
            icon: "format-list-checks",
            label: "Adicionar Visita",
            color: primaryColor,
            rippleColor: primariaClara,
            onPress: () => adicionarVisita(),
          },
        ]}
        onStateChange={onStateChange}
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
  },
  containerTop: {
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: white,
    borderRadius: 0,
    marginHorizontal: 5,
    marginBottom: 15,
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroudColor: primaryColor,
  },
  containerForm: {
    margin: 30,
    backgroundColor: white,
  },
  spaceComponents: {
    marginVertical: 8,
  },
  searchInput: {
    backgroundColor: white,
    borderRadius: 0,
    marginHorizontal: 5,
    marginBottom: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
  },
  statusStripe: {
    width: 10,
    height: "100%",
    marginRight: 10,
  },
  itemText: {
    fontSize: 16, // Tamanho da fonte do título
    color: "#333",
  },
  updateText: {
    fontSize: 14, // Tamanho da fonte do subtítulo
    color: "#666",
    marginTop: 4,
  },
  fabContainer: {
    right: 0,
    backgroundColor: primaryColor,
    bottom: 0,
  },
});
