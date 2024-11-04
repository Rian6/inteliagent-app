import { black, primaryColor, white } from "@root/components/_default/colors";
import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { SegmentedButtons } from "react-native-paper";

export default function DadosGerais() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([
    { id: "1", name: "Bairro Floresta", status: 1 },
    { id: "2", name: "Região Central", status: 0 },
    { id: "3", name: "Bairro Interlagos", status: 2 },
    // Adicione mais itens aqui com diferentes status
  ]);

  // Função para filtrar itens com base na busca
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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
  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês começa do 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [selectedOption, setSelectedOption] = useState("");
  const [value, setValue] = React.useState("");

  const options = [
    { label: "Opção 1", value: "1" },
    { label: "Opção 2", value: "2" },
    { label: "Opção 3", value: "3" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.containerForm}>
        <Text style={{ fontWeight: 14 }}>Situação da Visita</Text>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: "walk",
              label: "Normal",
            },
            {
              value: "train",
              label: "Recusado",
            },
            { value: "drive", label: "Fechado" },
          ]}
        />
        <InputTextForm
          label={"CEP"}
          placeholder={"Digite o CEP da localidade"}
          value={""}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <InputTextForm
          label={"Endereço"}
          placeholder={"Digite o endereço"}
          value={""}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              width: 350,
            },
            styles.spaceComponents,
          ]}
        >
          <InputTextForm
            label={"Numero"}
            placeholder={"Digite o numero"}
            value={""}
            style={[{ width: 170 }, styles.spaceComponents]}
          />
          <SelectInput
            label="Lado"
            items={options}
            selectedValue={selectedOption}
            onValueChange={(value) => setSelectedOption(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170, marginTop: 14 }}
          />
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              width: 350,
            },
            styles.spaceComponents,
          ]}
        >
          <SelectInput
            label="Tipo Imovél"
            items={options}
            selectedValue={selectedOption}
            onValueChange={(value) => setSelectedOption(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170, marginTop: 14 }}
          />
          <InputTextForm
            label={"Complemento"}
            placeholder={"Digite o numero"}
            value={""}
            style={[{ width: 170 }, styles.spaceComponents]}
          />
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              width: 350,
            },
            styles.spaceComponents,
          ]}
        >
          <DatePickerInput
            label="Primeira Visita"
            placeholder="Selecione uma data"
            onDateChange={(date) => console.log(date)}
            style={{ width: 170, marginTop: 8 }}
          />
          <DatePickerInput
            label="Segunda Visita"
            placeholder="Selecione uma data"
            onDateChange={(date) => console.log(date)}
            style={{ width: 170, marginTop: 8 }}
          />
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              width: 350,
            },
            styles.spaceComponents,
          ]}
        >
          <View>
            <Text style={{ fontWeight: 14 }}>Tipo da Visita</Text>
            <SegmentedButtons
              value={value}
              onValueChange={setValue}
              buttons={[
                {
                  value: "walk",
                  label: "N",
                },
                {
                  value: "train",
                  label: "R",
                },
              ]}
            />
          </View>
          <InputTextForm
            label={"Numero de quartos"}
            placeholder={"Digite o numero"}
            value={""}
            style={[{ width: 170, marginTop: 8 }, styles.spaceComponents]}
          />
        </View>
      </View>
      <Button
        title={"Continuar"}
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={() => {
          router.navigate("atendimento/registroServico");
        }}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    backgroundColor: white,
    alignItems: "center",
  },
  buttonLogin: {
    width: 350,
    height: 50,
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    backgroundColor: primaryColor,
    bottom: 0,
  },
});
