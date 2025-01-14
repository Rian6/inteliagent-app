import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { black, primaryColor, white } from "@root/components/_default/colors";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import Button from "@root/components/_default/button/Button";
import { useRouter } from 'expo-router';
import useVisitaStore from "@root/context/visitaContext";
import { inserirVisita } from "@root/db/visitaPersistence";

export default function TratamentoComponent() {
  const router = useRouter(); 
  const { visita, updateVisita } = useVisitaStore(); // Use o Zustand para acessar e atualizar o estado da visita
  const [segmentedValue, setSegmentedValue] = useState("não");
  const [depositosEliminados, setDepositosEliminados] = useState("");
  const [imoveisTratados, setImoveisTratados] = useState("");
  const [tipoLarvicida, setTipoLarvicida] = useState("");
  const [quantidadeCargaLarvicida, setQuantidadeCargaLarvicida] = useState("");
  const [quantidadeDepTratamento, setQuantidadeDepTratamento] = useState("");
  const [tipoAdulticida, setTipoAdulticida] = useState("");
  const [quantidadeCargaAdulticida, setQuantidadeCargaAdulticida] = useState("");

  // Atualiza o estado da visita no Zustand quando os dados mudam
  useEffect(() => {
    updateVisita({
      tratamento: {
        depositosEliminados,
        imoveisTratados,
        tipo: segmentedValue === "sim" ? tipoLarvicida : tipoAdulticida, // Exemplo de lógica para definir o tipo de larvicida/adulticida
        quantidadeTratamento: quantidadeDepTratamento,
        quantidadeCarga: segmentedValue === "sim" ? quantidadeCargaLarvicida : quantidadeCargaAdulticida,
      },
    });
  }, [depositosEliminados, imoveisTratados, tipoLarvicida, quantidadeCargaLarvicida, quantidadeDepTratamento, tipoAdulticida, quantidadeCargaAdulticida]);

  const handleContinue = async () => {
    const visitaData = { ...visita, tipoVisita: "Tratamento" }; // Exemplo de como configurar a visita
    const id = await inserirVisita(visitaData);
    if (id) {
      router.navigate("atendimento"); // Navega para a próxima tela
    } else {
      console.error("Erro ao salvar visita");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Foi necessário efetuar tratamento?</Text>
        <SegmentedButtons
          value={segmentedValue}
          onValueChange={setSegmentedValue}
          buttons={[
            { value: "sim", label: "Sim" },
            { value: "não", label: "Não" },
          ]}
        />

        <Text style={styles.sectionTitle}>Tratamento</Text>
        
        <View style={styles.inputContainer}>
          <InputTextForm
            label="Depósitos Eliminados"
            value={depositosEliminados}
            onChangeText={setDepositosEliminados}
            placeholder="Digite o número de depósitos eliminados"
          />

          <InputTextForm
            label="Imóveis Tratados"
            value={imoveisTratados}
            onChangeText={setImoveisTratados}
            placeholder="Digite o número de imóveis tratados"
          />
        </View>

        <Text style={styles.sectionTitle}>Tratamento Focal (Larvicida)</Text>
        
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <InputTextForm
              label="Tipo (L1)"
              value={tipoLarvicida}
              onChangeText={setTipoLarvicida}
              placeholder="Digite o tipo"
            />
          </View>
          <View style={styles.inputGroup}>
            <InputTextForm
              label="Quantidade da Carga"
              value={quantidadeCargaLarvicida}
              onChangeText={setQuantidadeCargaLarvicida}
              placeholder="Digite a quantidade da carga"
            />
          </View>
        </View>

        <InputTextForm
          label="Quantidade Dep. Tratamento"
          value={quantidadeDepTratamento}
          onChangeText={setQuantidadeDepTratamento}
          placeholder="Digite a quantidade de depósito"
        />

        <Text style={styles.sectionTitle}>Tratamento Perifocal (Adulticida)</Text>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <InputTextForm
              label="Tipo"
              value={tipoAdulticida}
              onChangeText={setTipoAdulticida}
              placeholder="Digite o tipo"
            />
          </View>
          <View style={styles.inputGroup}>
            <InputTextForm
              label="Quantidade da Carga"
              value={quantidadeCargaAdulticida}
              onChangeText={setQuantidadeCargaAdulticida}
              placeholder="Digite a quantidade da carga"
            />
          </View>
        </View>
      </ScrollView>
      <Button
        title="Continuar"
        styleLabel={styles.continueButton}
        styleText={{ color: white }}
        onPress={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: white,
  },
  continueButton: {
    width: 350,
    height: 50,
    backgroundColor: primaryColor,
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: black,
    marginVertical: 20,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
});
