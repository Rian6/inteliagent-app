import { black, primaryColor, white } from "@root/components/_default/colors";
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router, useGlobalSearchParams } from "expo-router";
import {
  getPlanejamentoById,
  inserirPlanejamento,
} from "@root/db/atendimentoPersistence";
import SnackBar from "@root/components/_default/snack-bar/SnackBar";

export default function DadosGerais() {
  const [cidade, setCidade] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [nome, setNome] = useState("");
  const [atividade, setAtividade] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [dataUltVisita, setDataUltVisita] = useState(new Date());
  const [ano, setAno] = useState("");
  const [zona, setZona] = useState("");
  const [status, setStatus] = useState(null);

  const [submitted, setSubmitted] = useState(false); // Controle de validação
  const [snackBarVisible, setSnackBarVisible] = useState(false); // Controle do SnackBar
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackBarIsError, setSnackBarIsError] = useState(false);

  const { id } = useGlobalSearchParams();

  const cidades = [{ id: 1, label: "Cascavel", value: 1 }];
  const situacoes = [
    { label: "Concluído", value: 1 },
    { label: "Pendente", value: 2 },
    { label: "Executando", value: 3 },
  ];

  useEffect(() => {
    if (id) {
      const loadPlanejamento = async () => {
        try {
          const atendimentoTmp = await getPlanejamentoById(id);
          if (atendimentoTmp) {
            setCidade(atendimentoTmp.idCidade);
            setCategoria(atendimentoTmp.idCategoria);
            setAtividade(atendimentoTmp.atividade);
            setTipo(atendimentoTmp.tipo);
            setDataUltVisita(new Date(atendimentoTmp.dataUltVisita));
            setNome(atendimentoTmp.nome);
            setAno(atendimentoTmp.ano);
            setZona(atendimentoTmp.zona);
            setStatus(atendimentoTmp.status);
          }
        } catch (error) {
          console.error("Erro ao carregar planejamento:", error);
        }
      };

      loadPlanejamento();
    }
  }, [id]);

  async function criarPlanejamento() {
    if (id) {
      router.navigate({
        pathname: "atendimento/visitas",
        params: { idPlanejamento: id },
      });
    }

    setSubmitted(true);

    if (!validate()) {
      //exibirMensagem("Preencha todos os campos obrigatórios.", true);
      // return;
    }

    const atendimento = {
      id: id,
      idCidade: cidade,
      idCategoria: categoria,
      atividade: atividade,
      tipo: tipo,
      dataUltVisita,
      nome,
      ano,
      zona,
      status: status,
      situacao: 1,
    };

    const newId = await inserirPlanejamento(atendimento);
    if (newId) {
      router.navigate({
        pathname: "atendimento/visitas",
        params: { id: newId },
      });
    } else {
      exibirMensagem(
        "Erro ao criar planejamento. Tente novamente mais tarde.",
        true
      );
    }
  }

  function validate() {
    return (
      cidade && categoria && atividade && tipo && nome && ano && zona && status
    );
  }

  function exibirMensagem(msg, isError) {
    setSnackBarMessage(msg);
    setSnackBarIsError(isError);
    setSnackBarVisible(true);
  }

  return (
    <View style={styles.container}>
      <View style={styles.containerForm}>
        <InputTextForm
          label={"Nome da Localidade"}
          placeholder={"Digite o nome da Localidade"}
          value={nome}
          onChangeText={setNome}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <SelectInput
          label="Situação"
          items={situacoes}
          selectedValue={status}
          onValueChange={(value) => setStatus(value)}
          placeholder="Selecione uma opção"
          style={{ width: 350 }}
        />
        <DatePickerInput
          label="Data da Visita"
          placeholder="Selecione uma data"
          onDateChange={setDataUltVisita}
          style={{ width: 350, marginTop: 8 }}
        />
        <InputTextForm
          label={"Ciclo/Ano"}
          placeholder={"Ciclo/Ano"}
          value={ano+""}
          onChangeText={setAno}
          style={{ width: 350 }}
        />
        <InputTextForm
          label={"Zona"}
          placeholder={"Digite a zona do local"}
          value={zona}
          onChangeText={setZona}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
      </View>
      <Button
        title={id ? "Alterar Planejamento" : "Criar Planejamento"}
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={criarPlanejamento}
      />
      <SnackBar
        message={snackBarMessage}
        visible={snackBarVisible}
        isError={snackBarIsError}
        onDismissCallBack={() => setSnackBarVisible(false)}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroundColor: primaryColor,
  },
  containerForm: {
    margin: 30,
    backgroundColor: white,
  },
  spaceComponents: {
  },
});
