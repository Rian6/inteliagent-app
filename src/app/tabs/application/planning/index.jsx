import { black, primaryColor, white } from "@root/components/_default/colors";
import { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text, Pressable, RefreshControl } from "react-native";
import { FAB, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getPlanejamentos } from "@root/db/atendimentoPersistence";
import InternetStatusMonitor from "@root/components/_default/internet/InternetStatusMonitor";

export default function Planning() {
  const [planejamento, setPlanejamentos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);  // Estado para controle do refresh

  useEffect(() => {
    fetchPlanejamentos(); // Carregar planejamentos ao montar o componente
  }, []);  

  // Função que busca os planejamentos
  const fetchPlanejamentos = async () => {
    try {
      const planejamentosTmp = await getPlanejamentos();
      setPlanejamentos(planejamentosTmp);
    } catch (error) {
      console.error("Erro ao buscar planejamentos:", error);
    }
  };

  // Função de busca com texto (utilizada pela Searchbar)
  async function buscarPlanejamentos(text = "") {
    const planejamentosTmp = await getPlanejamentos(text);
    setPlanejamentos(planejamentosTmp);
  }

  // Função de refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlanejamentos();  // Recarrega os planejamentos
    setRefreshing(false);  // Desativa o indicador de atualização
  };

  // Função para definir cor da listra dependendo do status
  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return "#4CAF50"; // Verde para concluído
      case 2:
        return "#FFC107"; // Amarelo para pendente
      case 3:
        return "#2196F3"; // Azul para em progresso
      default:
        return "#E0E0E0"; // Cinza para status desconhecido
    }
  };

  // Função para obter a data atual
  const getCurrentDate = (tmpDate) => {
    const date = new Date(tmpDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês começa do 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para iniciar o atendimento
  function iniciarAtendimento(id=null) {
    router.navigate({
      pathname: 'atendimento', 
      params: {id: id}
    });
  }

  return (
    <View style={styles.container}>
      <InternetStatusMonitor />
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
        onChangeText={(text) => buscarPlanejamentos(text)}
        placeholder="Digite uma região"
      />
      <FlatList
        data={planejamento}
        keyExtractor={(item) => item.id.toString()}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}  // Chama a função de refresh
            colors={['#A9007A']}  // Cor do indicador de carregamento
          />
        }
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
