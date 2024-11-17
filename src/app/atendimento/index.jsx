import { black, primaryColor, white } from "@root/components/_default/colors";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { inserirPlanejamento } from "@root/db/atendimentoPersistence";
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

  const cidades = [{ id: 1, label: "Cascavel", value: "1" }];
  const situacoes = [
    { label: "Concluído", value: 0 },
    { label: "Pendente", value: 1 },
    { label: "Executando", value: 2 },
  ];
  const categorias = [{ id: 1, label: "Teste", value: "1" }];
  const atividades = [{ id: 1, label: "Recolhimento", value: "1" }];
  const tipos = [{ id: 1, label: "Retorno", value: "1" }];

  async function criarPlanejamento() {
    setSubmitted(true); // Ativar validação ao tentar enviar o formulário

    if (!validate()) {
      exibirMensagem("Preencha todos os campos obrigatórios.", true);
      return;
    }

    const atendimento = {
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
      exibirMensagem("Planejamento criado com sucesso!", false);
      router.navigate("atendimento/visitas");
    } else {
      exibirMensagem("Erro ao criar planejamento. Tente novamente mais tarde.", true);
    }
  }

  function validate() {
    return cidade && categoria && atividade && tipo && nome && ano && zona && status;
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
          invalid={submitted && !nome}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <View
          style={[{ flexDirection: "row", justifyContent: "space-between", width: 350 }, styles.spaceComponents]}
        >
          <SelectInput
            label="Município"
            items={cidades}
            selectedValue={cidade}
            onValueChange={(value) => setCidade(value)}
            placeholder="Selecione uma opção"
            invalid={submitted && !cidade}
            style={{ width: 170 }}
          />
          <SelectInput
            label="Situação"
            items={situacoes}
            selectedValue={status}
            onValueChange={(value) => setStatus(value)}
            placeholder="Selecione uma opção"
            invalid={submitted && !status}
            style={{ width: 170 }}
          />
        </View>
        <SelectInput
          label="Categoria"
          items={categorias}
          selectedValue={categoria}
          onValueChange={(value) => setCategoria(value)}
          placeholder="Selecione uma opção"
          invalid={submitted && !categoria}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
        <View
          style={[{ flexDirection: "row", justifyContent: "space-between", width: 350 }, styles.spaceComponents]}
        >
          <SelectInput
            label="Atividade"
            items={atividades}
            selectedValue={atividade}
            onValueChange={(value) => setAtividade(value)}
            placeholder="Selecione uma opção"
            invalid={submitted && !atividade}
            style={{ width: 170 }}
          />
          <SelectInput
            label="Tipo"
            items={tipos}
            selectedValue={tipo}
            onValueChange={(value) => setTipo(value)}
            placeholder="Selecione uma opção"
            invalid={submitted && !tipo}
            style={{ width: 170 }}
          />
        </View>
        <View
          style={[{ flexDirection: "row", justifyContent: "space-between" }, styles.spaceComponents]}
        >
          <DatePickerInput
            label="Data da Visita"
            placeholder="Selecione uma data"
            onDateChange={setDataUltVisita}
            style={{ width: 170, marginTop: 8 }}
          />
          <InputTextForm
            label={"Ciclo/Ano"}
            placeholder={"Ciclo/Ano"}
            value={ano}
            onChangeText={setAno}
            invalid={submitted && !ano}
            style={{ width: 170 }}
          />
        </View>
        <InputTextForm
          label={"Zona"}
          placeholder={"Digite a zona do local"}
          value={zona}
          onChangeText={setZona}
          invalid={submitted && !zona}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
      </View>
      <Button
        title={"Criar Planejamento"}
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
    marginVertical: 8,
  },
});
