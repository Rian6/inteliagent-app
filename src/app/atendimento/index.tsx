import { planningReportErrors } from "@root/data/planning-report";
import ReportContextFields from "@root/components/reports/ReportContextFields";
import FormSection from "@root/components/_default/screen/FormSection";
import Button from "@root/components/_default/button/ActionButton";
import { useEffect, useState } from "react";
import {
  HelperText,
  Text,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from "react-native-paper";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import FormScreen from "@root/components/_default/screen/FormScreen";
import DatePickerInput from "@root/components/_default/date-picker-input/DatePickerInput";
import {
  getPlanejamentoById,
  inserirPlanejamento,
} from "@root/db/atendimentoPersistence";
import { useSessionStore } from "@root/context/sessionContext";
import catalog from "@root/data/planning-catalog.json";
import {
  emptyClassification,
  selectedClassification,
  mergeClassification,
  planningCycle,
} from "@root/data/planning-fields";
import CatalogSelect from "@root/components/_default/select-input/CatalogSelect";

export default function PlanningDetails() {
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      title: id ? "Dados do planejamento" : "Novo planejamento",
    });
  }, [navigation, id]);
  const profile = useSessionStore((state) => state.profile);
  const admin =
    !!profile?.permissions?.[id ? "editPlanning" : "createPlanning"];
  const [form, setForm] = useState<Record<string, any>>({
    nome: "",
    zona: "",
    ano: String(new Date().getFullYear()),
    status: 2,
    dataUltVisita: new Date(),
  });
  const [classification, setClassification] = useState<
    Record<string, number | null>
  >(emptyClassification());
  const [loading, setLoading] = useState(!!id),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [submitted, setSubmitted] = useState(false);
  const fields =
    !id && submitted
      ? planningReportErrors({ ...form, ...classification }, catalog)
      : {};
  const update = (patch: Record<string, any>) =>
    setForm((previous) => ({ ...previous, ...patch }));
  useEffect(() => {
    if (!id) return;
    let active = true;
    getPlanejamentoById(id)
      .then((item) => {
        if (!active) return;
        if (!item)
          throw new Error("Planejamento não encontrado neste aparelho.");
        setForm({
          ...item,
          nome: item.nome || "",
          zona: item.zona || "",
          ano: String(item.ano || "").slice(0, 4),
          dataUltVisita: item.dataUltVisita || new Date(),
        });
        setClassification(selectedClassification(item, catalog));
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function continuePlanning() {
    if (busy) return;
    if (!admin && id) {
      router.push({
        pathname: "/atendimento/visitas",
        params: { idPlanejamento: id },
      });
      return;
    }
    setSubmitted(true);
    setError("");
    if (!id) {
      const errors = planningReportErrors(
        { ...form, ...classification },
        catalog,
      );
      if (Object.keys(errors).length) {
        setError(Object.values(errors).join(" "));
        return;
      }
    }
    if (
      !String(form.nome).trim() ||
      !String(form.zona).trim() ||
      !/^\d{4}$/.test(form.ano)
    ) {
      setError("Informe nome, zona e ano com quatro dígitos.");
      return;
    }
    setBusy(true);
    try {
      const planId = await inserirPlanejamento({
        ...form,
        ...mergeClassification(form, classification, catalog),
        ciclo: planningCycle(form.ciclo),
        id: id || undefined,
      });
      router.replace({
        pathname: "/atendimento/visitas",
        params: {
          idPlanejamento: planId,
          savedAt: String(Date.now()),
          savedMessage: "Planejamento salvo com sucesso.",
        },
      });
    } catch (failure) {
      setError(failure.message || "Não foi possível salvar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormScreen safeArea={false} bottomSafeArea testID="planning-form-scroll">
      <Text>
        Organize a localidade, o período de trabalho e as visitas da equipe.
      </Text>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Carregando planejamento" />
      ) : (
        <>
          <FormSection
            title="Onde a equipe vai atuar?"
            icon="map-marker-radius-outline"
          >
            <TextInput
              testID="planning-name"
              mode="outlined"
              accessibilityLabel="Nome da localidade"
              label="Nome da localidade"
              value={form.nome}
              onChangeText={(nome) => update({ nome })}
              disabled={!admin || busy}
              error={submitted && !String(form.nome).trim()}
              maxLength={255}
            />
            <ReportContextFields
              value={form.boletim || {}}
              onChange={(boletim) => update({ boletim })}
              disabled={!admin || busy}
              required={!id}
              error={fields.codigoLocalidade}
            />
            <TextInput
              testID="planning-zone"
              mode="outlined"
              accessibilityLabel="Zona"
              label="Zona"
              value={form.zona}
              onChangeText={(zona) => update({ zona })}
              disabled={!admin || busy}
              error={submitted && !String(form.zona).trim()}
              maxLength={255}
            />
          </FormSection>
          <Text variant="bodySmall" style={{ color: "#6B6B73" }}>
            Supervisor:{" "}
            {form.boletim?.supervisorNome ||
              (!id ? profile?.nome : "Responsável não identificado")}
            . Definido automaticamente.
          </Text>
          <FormSection title="Período e andamento" icon="calendar-outline">
            <TextInput
              testID="planning-year"
              mode="outlined"
              accessibilityLabel="Ano"
              label="Ano"
              value={form.ano}
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(ano) => update({ ano })}
              disabled={!admin || busy}
            />
            <TextInput
              mode="outlined"
              accessibilityLabel="Ciclo"
              label={!id ? "Ciclo *" : "Ciclo"}
              error={!!fields.ciclo}
              value={String(form.ciclo ?? "")}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(ciclo) => update({ ciclo })}
              disabled={!admin || busy}
            />
            <HelperText type="info">
              Ciclo e ano são registrados separadamente. O ciclo segue o
              calendário de trabalho da equipe.
            </HelperText>
            <DatePickerInput
              label="Data da visita"
              value={form.dataUltVisita}
              onDateChange={(dataUltVisita) => update({ dataUltVisita })}
              disabled={!admin || busy}
            />
            <Text variant="titleMedium">Situação do planejamento</Text>
            <RadioButton.Group
              value={String(form.status)}
              onValueChange={(status) => update({ status: Number(status) })}
            >
              {[
                [2, "Pendente"],
                [3, "Em andamento"],
                [1, "Concluído"],
              ].map(([value, label]) => (
                <RadioButton.Item
                  key={value}
                  label={String(label)}
                  value={String(value)}
                  disabled={!admin || busy}
                />
              ))}
            </RadioButton.Group>
          </FormSection>
          <FormSection
            title="Classificação do planejamento"
            collapsible={!!id}
            description={
              !id
                ? "Município, categoria, atividade e tipo da localidade."
                : "Município, categoria, atividade e tipo da localidade."
            }
            icon="tag-outline"
          >
            <Text>
              {id && !form.catalogoVersao
                ? "A classificação anterior foi preservada. Para atualizá-la, selecione os quatro campos."
                : !id
                  ? "Defina a atividade e a classificação da localidade."
                  : "Preencha os quatro campos para atualizar a classificação PNCD/FAD."}
            </Text>
            <CatalogSelect
              required={!id}
              error={fields.idCidade}
              label="Município"
              items={catalog.municipios}
              value={classification.idCidade}
              disabled={!admin || busy}
              onChange={(idCidade) =>
                setClassification((previous) => ({ ...previous, idCidade }))
              }
            />
            <CatalogSelect
              required={!id}
              error={fields.idCategoria}
              label="Categoria da localidade"
              items={catalog.categorias}
              value={classification.idCategoria}
              disabled={!admin || busy}
              onChange={(idCategoria) =>
                setClassification((previous) => ({ ...previous, idCategoria }))
              }
            />
            <CatalogSelect
              required={!id}
              error={fields.atividade}
              label="Atividade"
              items={catalog.atividades}
              value={classification.atividade}
              disabled={!admin || busy}
              onChange={(atividade) =>
                setClassification((previous) => ({ ...previous, atividade }))
              }
            />
            <CatalogSelect
              required={!id}
              error={fields.tipo}
              label="Tipo da localidade"
              items={catalog.tipos}
              value={classification.tipo}
              disabled={!admin || busy}
              onChange={(tipo) =>
                setClassification((previous) => ({ ...previous, tipo }))
              }
            />
          </FormSection>
          {!!Object.keys(fields).length && (
            <HelperText type="error">
              {Object.values(fields).join(" ")}
            </HelperText>
          )}
          {!!error && (
            <HelperText type="error" accessibilityLiveRegion="polite">
              {error}
            </HelperText>
          )}
          <Button
            testID="planning-save"
            mode="contained"
            contentStyle={{ minHeight: 52 }}
            loading={busy}
            disabled={busy || loading || (!admin && !id)}
            onPress={continuePlanning}
          >
            {admin ? "Salvar e ver visitas" : "Ver visitas"}
          </Button>
          {id && admin && (
            <Button
              contentStyle={{ minHeight: 48 }}
              onPress={() =>
                router.push({
                  pathname: "/atendimento/visitas",
                  params: { idPlanejamento: id },
                })
              }
            >
              Ver visitas sem alterar
            </Button>
          )}
        </>
      )}
    </FormScreen>
  );
}
