import { black, primaryColor, white } from "@root/components/_default/colors";
import { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text, Pressable } from "react-native";
import { FAB, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou de react-native-vector-icons
import { icon } from "@fortawesome/fontawesome-svg-core";
import { router } from "expo-router";
import { getPlanejamentos } from "@root/db/atendimentoPersistence";

export default function Planning() {
  const[planejamento, setPlanejamentos] = useState([]);
  
  useEffect(() => {
    const fetchPlanejamentos = async () => {
      try {
        const planejamentosTmp = await getPlanejamentos();
        setPlanejamentos(planejamentosTmp);
      } catch (error) {
        console.error("Erro ao buscar planejamentos:", error);
      }
    };
  
    fetchPlanejamentos();
  }, []);  

  const [search, setSearch] = useState("");
  const [items, setItems] = useState([
    { id: "1", name: "Bairro Floresta", status: 1 },
    { id: "2", name: "Região Central", status: 0 },
    { id: "3", name: "Bairro Interlagos", status: 2 },
    // Adicione mais itens aqui com diferentes status
  ]);

  // Função para definir cor da listra dependendo do status
  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return "#4CAF50"; // Verde para concluído
      case 1:
        return "#FFC107"; // Amarelo para pendente
      case 2:
        return "#2196F3"; // Azul para em progresso
      default:
        return "#E0E0E0"; // Cinza para status desconhecido
    }
  };

  // Função para obter a data atual
  const getCurrentDate = (tmpDate) => {
    const date = new Date(tmpDate)
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês começa do 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  function iniciarAtendimento(id=null) {
    router.navigate({
      pathname: 'atendimento', 
      params: {id: id}
    })
  }

  return (
    <View style={styles.container}>
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
        placeholder="Digite uma região"
      />
      <FlatList
        data={planejamento}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.itemContainer} 
            onPress={() => {iniciarAtendimento(item.id)}}>
            <View
              style={[
                styles.statusStripe,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <View>
              <Text style={styles.itemText}>{item.nome}</Text>
              <Text style={styles.updateText}>
                Última atualização: {getCurrentDate(item.data)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        color={white}
        onPress={() => iniciarAtendimento()}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    backgroundColor: primaryColor,
    bottom: 0,
  },
});
