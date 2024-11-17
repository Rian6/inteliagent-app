import { black, primaryColor, white } from "@root/components/_default/colors";
import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text, ScrollView } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { SegmentedButtons } from "react-native-paper";

export default function DadosGerais() {

  const [selectedOption, setSelectedOption] = useState("");
  const [value, setValue] = React.useState("");

  const options = [
    { label: "Opção 1", value: "1" },
    { label: "Opção 2", value: "2" },
    { label: "Opção 3", value: "3" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerForm}>
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
      </ScrollView>
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
    marginTop: 5,
    backgroundColor: white,
    alignItems: "center",
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginBottom: 10,
    backgroudColor: primaryColor,
  },
  containerForm: {
    margin: 0,
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
