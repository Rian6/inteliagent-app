import { View } from "react-native";
import {
  Text,
  Button,
  Disclosure,
  Choice,
  DateField,
} from "@root/components/ui";
import VisitScreen from "@root/components/visitas/VisitScreen";
import { goVisit } from "@root/components/visitas/visitNavigation";
import useVisitaStore from "@root/context/visitaContext";
import { useFinishVisit } from "@root/hooks/useFinishVisit";
import { inspectionItems } from "@root/data/inspection-items";
import { colors as c } from "@root/theme";
const states: Record<number, string> = {
  1: "Imóvel fechado",
  2: "Visita recusada",
  3: "Visita realizada",
  4: "Visita rejeitada",
  5: "Imóvel aberto",
};
const dateLabel = (value: any) =>
  value
    ? new Date(
        typeof value === "string" ? value.replace(" ", "T") : value,
      ).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
export default function Review() {
  const { visita, updateVisita } = useVisitaStore(),
    { busy, error, finish } = useFinishVisit();
  const selected = inspectionItems.filter((item) =>
    (visita.itensInspecionados || []).includes(item.id),
  );
  const treatment = visita.tratamento;
  const modalities = ["focal", "perifocal"].filter(
    (mode) => treatment[mode]?.ativo,
  );
  return (
    <VisitScreen
      page="revisao"
      title="Revisar visita"
      primaryLabel="Concluir visita"
      onPrimary={finish}
      busy={busy}
      error={error}
      testID="visit-review-scroll"
    >
      <View
        style={{
          backgroundColor: c.background,
          borderRadius: 14,
          padding: 16,
          gap: 8,
        }}
      >
        <Text bold style={{ fontSize: 18, lineHeight: 26 }}>
          {visita.nome}, {visita.numero || "s/n"}
        </Text>
        {!!visita.complemento && (
          <Text muted small>
            {visita.complemento}
          </Text>
        )}
        <Text small style={{ color: c.primary }}>
          {states[Number(visita.situacaoVisita)] || "Visita"}
        </Text>
        <Button
          variant="ghost"
          onPress={() => goVisit("index")}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 0,
            minHeight: 40,
          }}
        >
          Editar imóvel
        </Button>
      </View>
      {(Number(visita.situacaoVisita) === 3 || selected.length > 0) && (
        <View style={{ gap: 8 }}>
          <Text bold>Inspeção</Text>
          {selected.length ? (
            selected.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text muted small style={{ flex: 1 }}>
                  {item.code} · {item.label}
                </Text>
                <Text small bold>
                  {visita.depositosInspecionados?.[item.id] || 0}
                </Text>
              </View>
            ))
          ) : (
            <Text small muted>
              Nenhum depósito registrado.
            </Text>
          )}
          <Button
            variant="ghost"
            onPress={() => goVisit("inspecao")}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 0,
              minHeight: 40,
            }}
          >
            Editar atendimento
          </Button>
        </View>
      )}
      {visita.contemAmostra && (
        <View style={{ gap: 4 }}>
          <Text bold>Amostras</Text>
          <Text small muted>
            {visita.amostra.quantidade || 0} tubitos · Nº{" "}
            {visita.amostra.numeroInicio || 0} a{" "}
            {visita.amostra.numeroFinal || 0} ·{" "}
            {(visita.amostra.imagens || []).length} fotos
          </Text>
          <Button
            variant="ghost"
            onPress={() => goVisit("amostra")}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 0,
              minHeight: 40,
            }}
          >
            Editar coleta
          </Button>
        </View>
      )}
      {visita.contemTratamento && (
        <View style={{ gap: 4 }}>
          <Text bold>Tratamento</Text>
          <Text small muted>
            {treatment.depositosEliminados || 0} depósitos eliminados ·{" "}
            {treatment.imoveisTratados || 0} imóveis tratados
          </Text>
          {modalities.map((mode) => (
            <Text small muted key={mode}>
              {mode === "focal" ? "Focal" : "Perifocal"}:{" "}
              {treatment[mode].tipo || "Não informado"} · Carga{" "}
              {treatment[mode].quantidadeCarga || 0} ·{" "}
              {treatment[mode].quantidadeTratamento || 0} depósitos
            </Text>
          ))}
          {!modalities.length && !!treatment.tipo && (
            <Text small muted>
              {treatment.tipo} · Carga {treatment.quantidadeCarga || 0} ·{" "}
              {treatment.quantidadeTratamento || 0} depósitos
            </Text>
          )}
          <Button
            variant="ghost"
            onPress={() => goVisit("tratamento")}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 0,
              minHeight: 40,
            }}
          >
            Editar tratamento
          </Button>
        </View>
      )}
      <Disclosure
        title="Data da visita e retorno"
        summary={`${dateLabel(visita.primeiraVisita)} · ${visita.tipoVisita === "R" ? "Retorno" : "Visita normal"}${visita.segundaVisita ? " · Retorno agendado" : ""}`}
      >
        <DateField
          label="Data da visita"
          value={visita.primeiraVisita || new Date()}
          onChange={(primeiraVisita) => updateVisita({ primeiraVisita })}
        />
        <Text small bold>
          Tipo da visita
        </Text>
        <Choice
          label="Tipo da visita"
          value={visita.tipoVisita || "N"}
          onChange={(tipoVisita) => updateVisita({ tipoVisita })}
          options={[
            { label: "Visita normal", value: "N" },
            { label: "Retorno", value: "R" },
          ]}
        />
        <DateField
          label="Data do retorno"
          value={visita.segundaVisita}
          onChange={(segundaVisita) => updateVisita({ segundaVisita })}
        />
        {!!visita.segundaVisita && (
          <Button
            variant="ghost"
            onPress={() => updateVisita({ segundaVisita: null })}
          >
            Remover data do retorno
          </Button>
        )}
      </Disclosure>
    </VisitScreen>
  );
}
