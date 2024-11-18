import { black, primaryColor, white } from "@root/components/_default/colors";
import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { SegmentedButtons } from "react-native-paper";
import useVisitaStore from "@root/context/visitaContext";

export default function DadosGerais() {
  const { visita, updateVisita } = useVisitaStore();

  const options = [
    { label: "Opção 1", value: "1" },
    { label: "Opção 2", value: "2" },
    { label: "Opção 3", value: "3" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerForm}>
        <Text style={{ fontWeight: "bold" }}>Situação da Visita</Text>
        <SegmentedButtons
          value={visita.situacaoVisita}
          onValueChange={(value) => updateVisita({ situacaoVisita: value })}
          buttons={[
            { value: "normal", label: "Normal" },
            { value: "recusado", label: "Recusado" },
            { value: "fechado", label: "Fechado" },
          ]}
        />
        <InputTextForm
          label="CEP"
          placeholder="Digite o CEP da localidade"
          value={visita.cep}
          onChangeText={(text) => updateVisita({ cep: text })}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <InputTextForm
          label="Endereço"
          placeholder="Digite o endereço"
          value={visita.endereco}
          onChangeText={(text) => updateVisita({ endereco: text })}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <View style={[styles.row, styles.spaceComponents]}>
          <InputTextForm
            label="Número"
            placeholder="Digite o número"
            value={visita.numero}
            onChangeText={(text) => updateVisita({ numero: text })}
            style={{ width: 170 }}
          />
          <SelectInput
            label="Lado"
            items={options}
            selectedValue={visita.lado}
            onValueChange={(value) => updateVisita({ lado: value })}
            placeholder="Selecione uma opção"
            style={{ width: 170, marginTop: 14 }}
          />
        </View>
        <View style={[styles.row, styles.spaceComponents]}>
          <SelectInput
            label="Tipo Imóvel"
            items={options}
            selectedValue={visita.tipoImovel}
            onValueChange={(value) => updateVisita({ tipoImovel: value })}
            placeholder="Selecione uma opção"
            style={{ width: 170, marginTop: 14 }}
          />
          <InputTextForm
            label="Complemento"
            placeholder="Digite o complemento"
            value={visita.complemento}
            onChangeText={(text) => updateVisita({ complemento: text })}
            style={{ width: 170 }}
          />
        </View>
        <View style={[styles.row, styles.spaceComponents]}>
          <DatePickerInput
            label="Primeira Visita"
            placeholder="Selecione uma data"
            onDateChange={(date) => updateVisita({ primeiraVisita: date })}
            style={{ width: 170 }}
          />
          <DatePickerInput
            label="Segunda Visita"
            placeholder="Selecione uma data"
            onDateChange={(date) => updateVisita({ segundaVisita: date })}
            style={{ width: 170 }}
          />
        </View>
        <View style={[styles.row, styles.spaceComponents]}>
          <View>
            <Text style={{ fontWeight: "bold" }}>Tipo da Visita</Text>
            <SegmentedButtons
              value={visita.tipoVisita}
              onValueChange={(value) => updateVisita({ tipoVisita: value })}
              buttons={[
                { value: "N", label: "N" },
                { value: "R", label: "R" },
              ]}
            />
          </View>
          <InputTextForm
            label="Número de Quartos"
            placeholder="Digite o número"
            value={String(visita.numeroQuartos)}
            onChangeText={(text) =>
              updateVisita({ numeroQuartos: parseInt(text) || 0 })
            }
            style={{ width: 170 }}
          />
        </View>
      </ScrollView>
      <Button
        title="Continuar"
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={() => {
          router.navigate("atendimento/registroServico/inspecao");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
  },
  containerForm: {
    margin: 0,
    backgroundColor: white,
  },
  spaceComponents: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 350,
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginBottom: 10,
    backgroundColor: primaryColor,
  },
});
