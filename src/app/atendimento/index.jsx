import { black, primaryColor, white } from "@root/components/_default/colors";
import { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Text } from "react-native";
import InputTextForm from "@root/components/_default/input-text-form/InputTextForm";
import SelectInput from "@root/components/_default/select-input/SelectInput";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import Button from "@root/components/_default/button/Button";
import { router } from "expo-router";
import { inserirPlanejamento } from "@root/db/atendimentoPersistence";

export default function DadosGerais() {
  const [selectedOption, setSelectedOption] = useState("");

  const [cidade, setCidade] = useState({});
  const [categoria, setCategoria] = useState({});
  const [nome, setNome] = useState("");
  const [atividade, setAtividade] = useState({});
  const [tipo, setTipo] = useState({});
  const [dataUltVisita, setDataUltVisita] = useState(new Date());
  const [ano, setAno] = useState("");
  const [zona, setZona] = useState("");
  const [status, setStatus] = useState({});

  const cidades = [{ id: 1, label: "Opção 1", value: "1" }];

  const situacoes = [{ id: 1, label: "Opção 1", value: "1" }];

  const categorias = [{ id: 1, label: "Opção 1", value: "1" }];

  const atividades = [{ id: 1, label: "Opção 1", value: "1" }];

  const tipos = [{ id: 1, label: "Opção 1", value: "1" }];

  async function criarPlanejamento() {
    const atendimento = {
      idCidade: cidade.id,
      idCategoria: categoria.id,
      atividade: atividade.id,
      tipo: tipo.id,
      dataUltVisita,
      ano,
      zona,
      status: status.id,
      situacao: 1,
    };

    const newId = await inserirPlanejamento(atendimento);
    if (newId) {
      router.navigate("atendimento/visitas");
    }
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
            label="Municipio"
            items={cidades}
            selectedValue={cidade}
            onValueChange={(value) => setCidade(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170 }}
          />
          <SelectInput
            label="Situação"
            items={situacoes}
            selectedValue={status}
            onValueChange={(value) => setStatus(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170 }}
          />
        </View>
        <SelectInput
          label="Categoria"
          items={categorias}
          selectedValue={categoria}
          onValueChange={(value) => setCategoria(value)}
          placeholder="Selecione uma opção"
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
          <SelectInput
            label="Atividade"
            items={atividades}
            selectedValue={atividade}
            onValueChange={(value) => setAtividade(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170 }}
          />
          <SelectInput
            label="Tipo"
            items={tipos}
            selectedValue={tipo}
            onValueChange={(value) => setTipo(value)}
            placeholder="Selecione uma opção"
            style={{ width: 170 }}
          />
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
            },
            styles.spaceComponents,
          ]}
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
            style={{ width: 170 }}
          />
        </View>
        <InputTextForm
          label={"Zona"}
          placeholder={"Digite a zona do local"}
          value={zona}
          onChangeText={setZona}
          style={[{ width: 350 }, styles.spaceComponents]}
        />
      </View>
      <Button
        title={"Criar Planejamento"}
        styleLabel={styles.buttonLogin}
        styleText={{ color: white }}
        onPress={criarPlanejamento}
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
