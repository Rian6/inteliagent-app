import { black, primaryColor, white } from "@root/components/_default/colors";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router, useGlobalSearchParams } from "expo-router";
import { SegmentedButtons } from "react-native-paper";
import useVisitaStore from "@root/context/visitaContext";
import { findVisitaById } from "@root/db/visitaPersistence";
import { consultaCep } from "@root/service/api/consultaCep";
import SnackBar from "@root/components/_default/snack-bar/SnackBar";

export default function DadosGerais() {
  const { visita, updateVisita, resetVisita } = useVisitaStore();
  const { idVisita, idPlanejamento } = useGlobalSearchParams();
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVisible, setSnackVisible] = useState(false);
  const [validateExecute, setValidateExecute] = useState(false);

  useEffect(() => {
    async function getVisita() {
      const visitaSalva = await findVisitaById(idVisita);
      updateVisita(visitaSalva);
    }
    if (idVisita) {
      getVisita();
    } else {
      resetVisita();
    }

    updateVisita({ idPlanejamento: idPlanejamento });
  }, []);

  function validate() {
    setValidateExecute(true);

    if (
      visita.cep &&
      visita.nome &&
      visita.numero &&
      visita.lado &&
      visita.tipoImovel &&
      visita.complemento &&
      visita.tipoVisita &&
      visita.numeroQuartos
    ) {
      return true;
    }

    setSnackMessage("Preencha os campos obrigatórios!");
    setSnackVisible(true);

    return false;
  }

  function continuar() {
    //if (validate()) {
      router.navigate("atendimento/registroServico/inspecao");
    //}
  }

  async function consultarCep() {
    if (visita.cep && visita.cep.length === 9) {
      const cep = await consultaCep(visita.cep);
      if (cep.status === 200) {
        const response = cep.data;
        updateVisita({ nome: response.logradouro });
      }
    }
  }

  const optionsLado = [
    { label: "Direito", value: "D" },
    { label: "Esquerdo", value: "E" },
  ];

  const options = [
    { label: "Opção 1", value: "1" },
    { label: "Opção 2", value: "2" },
    { label: "Opção 3", value: "3" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerForm}>
        <Text style={{fontSize: 12}}>Situação da Visita</Text>
        <SegmentedButtons
        style={{ width: 350 }}
          value={visita.situacaoVisita}
          onValueChange={(value) => updateVisita({ situacaoVisita: value })}
          buttons={[
            { value: "N", label: "Normal" },
            { value: "R", label: "Recusado" },
            { value: "F", label: "Fechado" },
          ]}
        />
        {visita.situacaoVisita == 'N' &&
          <>
            <InputTextForm
              label="CEP"
              isCep
              placeholder="Digite o CEP da localidade"
              value={visita.cep}
              onBlur={consultarCep}
              onChangeText={(text) => updateVisita({ cep: text })}
              style={[{ width: 350 }, styles.spaceComponents]}
              invalid={!visita.cep && validateExecute}
            />
            <InputTextForm
              label="Endereço"
              placeholder="Digite o endereço"
              value={visita.nome}
              onChangeText={(text) => updateVisita({ nome: text })}
              style={[{ width: 350 }, styles.spaceComponents]}
              invalid={!visita.nome && validateExecute}
            />
            <InputTextForm
              label="Número"
              placeholder="Digite o número"
              value={visita.numero+""}
              onChangeText={(text) => updateVisita({ numero: text })}
              style={[{ width: 350 }, styles.spaceComponents]}
              invalid={!visita.numero && validateExecute}
            />
            <InputTextForm
              label="Número de Quartos"
              placeholder="Digite o número"
              value={String(visita.numeroQuartos)}
              onChangeText={(text) =>
                updateVisita({ numeroQuartos: parseInt(text) || 0 })
              }
              style={styles.spaceComponents}
              invalid={!visita.numeroQuartos && validateExecute} // Marca como inválido
            />
            <InputTextForm
              label="Complemento"
              placeholder="Digite o complemento"
              value={visita.complemento}
              onChangeText={(text) => updateVisita({ complemento: text })}
              style={[{ width: 350 }, styles.spaceComponents]}
            />
            <DatePickerInput
              label="Data Visita"
              placeholder="Selecione uma data"
              onDateChange={(date) => updateVisita({ primeiraVisita: date })}
              style={[{ width: 350 }, styles.spaceComponents]}
              invalid={!visita.primeiraVisita && validateExecute} // Marca como inválido
            />
          </>
        }
      </ScrollView>
      <Button
        title={visita.situacaoVisita == 'N' ? "Continuar" : "Finalizar"}
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={continuar}
      />
      <SnackBar
        message={snackMessage}
        visible={snackVisible}
        onDismissCallBack={() => setSnackVisible(false)}
        isError={true}
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
    width: 350,
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
