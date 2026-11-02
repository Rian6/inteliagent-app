import { useSessionStore } from "@root/context/sessionContext";
import { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  Text,
  Toggle,
  Field,
  Choice,
  Disclosure,
  Button,
  SelectField,
  ErrorText,
} from "@root/components/ui";
import VisitScreen from "@root/components/visitas/VisitScreen";
import { goVisit } from "@root/components/visitas/visitNavigation";
import useVisitaStore from "@root/context/visitaContext";
import { addressError } from "@root/data/visit-flow";
import {
  lookupPostalAddress,
  postalDigits,
  formatPostalCode,
} from "@root/utils/postalAddress";
import { database } from "@root/offline/database";
export default function General() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { visita, updateVisita } = useVisitaStore();
  const [lookupBusy, setLookupBusy] = useState(false),
    [lookupError, setLookupError] = useState(""),
    [locality, setLocality] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [properties, setProperties] = useState<Record<string, any>[]>([]);
  const initialCep = useRef(visita.nome ? postalDigits(visita.cep) : "");
  const profile = useSessionStore((state) => state.profile);
  useEffect(() => {
    if (!visita.primeiraVisita && !visita.boletim?.agenteNome && profile?.nome)
      updateVisita({
        boletim: {
          ...visita.boletim,
          agenteNome: profile.nome,
          agenteCodigo: visita.boletim?.agenteCodigo || "",
          horaEntrada:
            visita.boletim?.horaEntrada ||
            new Date().toTimeString().slice(0, 5),
        },
      });
  }, [visita.id, profile?.id]);
  const normal = Number(visita.situacaoVisita) === 3;
  useEffect(() => {
    if (!showSuggestions) {
      setProperties([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const cep = postalDigits(visita.cep),
        name = String(visita.nome || "").trim();
      if (cep.length !== 8 && name.length < 3) {
        if (active) setProperties([]);
        return;
      }
      try {
        const rows = await database.getAllAsync(
          "SELECT NOME,NUMERO,CEP,COMPLEMENTO,LADO,TIPO_IMOVEL,LATITUDE,LONGITUDE FROM VISITA WHERE ID<>? AND COALESCE(SITUACAO,1)<>0 AND ((?<>'' AND replace(CEP,'-','')=?) OR (?<>'' AND NOME LIKE ?)) ORDER BY PRIMEIRA_VISITA DESC LIMIT 5",
          [
            visita.id,
            cep.length === 8 ? cep : "",
            cep,
            name.length >= 3 ? name : "",
            `%${name}%`,
          ],
        );
        if (active)
          setProperties(
            rows.filter(
              (row) =>
                row.NOME !== visita.nome ||
                String(row.NUMERO || "") !== String(visita.numero || ""),
            ),
          );
      } catch {
        if (active) setProperties([]);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [visita.cep, visita.nome, visita.numero, showSuggestions]);

  async function lookup(signal?: AbortSignal, explicit = false) {
    const cep = postalDigits(useVisitaStore.getState().visita.cep);
    const previousName = useVisitaStore.getState().visita.nome;
    if (cep.length !== 8) {
      if (explicit) setLookupError("Informe os 8 dígitos do CEP.");
      return;
    }
    setLookupBusy(true);
    setLookupError("");
    try {
      const address = await lookupPostalAddress(cep, signal);
      const current = useVisitaStore.getState().visita;
      if (signal?.aborted || postalDigits(current.cep) !== cep) return;
      // Late responses must not erase an address the agent has just edited.
      if (explicit || current.nome === previousName) {
        if (address.street) updateVisita({ nome: address.street });
      }
      setLocality(
        [address.district, address.city, address.state]
          .filter(Boolean)
          .join(" · "),
      );
      if (!address.street)
        setLookupError(
          "Este CEP não informa a rua. Complete o endereço abaixo.",
        );
      initialCep.current = cep;
    } catch (failure) {
      if (!signal?.aborted)
        setLookupError(
          failure.message ||
            "Sem conexão para consultar. Você pode preencher o endereço manualmente.",
        );
    } finally {
      if (!signal?.aborted) setLookupBusy(false);
    }
  }
  useEffect(() => {
    const cep = postalDigits(visita.cep);
    setLookupError("");
    setLocality("");
    setLookupBusy(false);
    if (cep.length !== 8 || cep === initialCep.current) return;
    const controller = new AbortController();
    const timer = setTimeout(() => lookup(controller.signal), 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [visita.cep]);

  function continueVisit() {
    setSubmitted(true);
    if (addressError(visita)) return;
    goVisit(normal ? "inspecao" : "revisao");
  }
  return (
    <VisitScreen
      page="index"
      title="Dados do imóvel"
      primaryLabel={normal ? "Continuar para inspeção" : "Revisar e concluir"}
      onPrimary={continueVisit}
      testID="visit-general-scroll"
    >
      <View style={{ gap: 8 }}>
        <Text small bold>
          Situação encontrada
        </Text>
        <Choice
          label="Situação da visita"
          value={Number(visita.situacaoVisita)}
          onChange={(situacaoVisita) => updateVisita({ situacaoVisita })}
          options={[
            { value: 3, label: "Aberto" },
            { value: 1, label: "Fechado" },
            { value: 2, label: "Recusado" },
          ]}
        />
        {[4, 5].includes(Number(visita.situacaoVisita)) && (
          <Text small muted>
            Selecione a situação para atualizar o registro.
          </Text>
        )}
      </View>
      <Field
        testID="visit-address"
        name="nome"
        label="Endereço"
        placeholder="Rua, avenida ou nome do imóvel"
        value={visita.nome || ""}
        maxLength={255}
        onChangeText={(nome) => updateVisita({ nome })}
        error={
          submitted && !String(visita.nome || "").trim()
            ? "Informe o endereço."
            : undefined
        }
      />
      <Field
        testID="visit-number"
        name="numero"
        label="Número do imóvel"
        placeholder="Número ou s/n"
        value={String(visita.numero || "")}
        maxLength={32}
        onChangeText={(numero) => updateVisita({ numero })}
      />
      <Disclosure
        title="Buscar endereço"
        validationKeys={["cep"]}
        summary={
          visita.cep
            ? formatPostalCode(visita.cep)
            : "Por CEP ou imóvel já cadastrado"
        }
      >
        <Field
          testID="visit-cep"
          name="cep"
          label="CEP"
          value={formatPostalCode(visita.cep)}
          keyboardType="number-pad"
          maxLength={9}
          onChangeText={(cep) => updateVisita({ cep: formatPostalCode(cep) })}
          trailing={
            lookupBusy ? (
              <ActivityIndicator style={{ margin: 12 }} />
            ) : (
              <Button
                variant="ghost"
                icon="magnify"
                label="Consultar CEP"
                onPress={() => lookup(undefined, true)}
                style={{ paddingHorizontal: 12 }}
              />
            )
          }
        />
        {!!lookupError && (
          <Text small muted>
            {lookupError}
          </Text>
        )}
        {!!locality && (
          <Text small muted>
            {locality}
          </Text>
        )}
        <Button variant="secondary" onPress={() => setShowSuggestions(true)}>
          Buscar pelo endereço ou CEP informado
        </Button>
        {showSuggestions && !properties.length && (
          <Text small muted>
            Nenhum outro imóvel encontrado. Informe ao menos três letras da rua
            ou o CEP completo.
          </Text>
        )}
        {properties.map((row, index) => (
          <Button
            key={index}
            variant="ghost"
            onPress={() => {
              updateVisita({
                nome: row.NOME,
                numero: row.NUMERO,
                cep: row.CEP,
                complemento: row.COMPLEMENTO || "",
                lado: row.LADO || "",
                tipoImovel: row.TIPO_IMOVEL || "",
                latitude: row.LATITUDE,
                longitude: row.LONGITUDE,
              });
              setShowSuggestions(false);
            }}
          >
            {row.NOME}, {row.NUMERO || "s/n"}
          </Button>
        ))}
      </Disclosure>
      <Disclosure
        title="Dados do boletim"
        summary="Quarteirão, identificação e horário"
        validationKeys={[
          "boletim.quarteirao",
          "boletim.ladoQuarteirao",
          "boletim.horaEntrada",
        ]}
      >
        {[
          ["quarteirao", "Número do quarteirão"],
          ["sequenciaQuarteirao", "Sequência do quarteirão"],
          ["ladoQuarteirao", "Face do quarteirão"],
          ["sequenciaImovel", "Sequência do imóvel"],
          ["horaEntrada", "Hora de entrada (HH:MM)"],
          ["agenteNome", "Agente responsável"],
          ["agenteCodigo", "Código do agente"],
        ].map(([key, label]) => (
          <Field
            key={key}
            name={"boletim." + key}
            label={label}
            maxLength={key === "horaEntrada" ? 5 : 120}
            value={String(visita.boletim?.[key] || "")}
            onChangeText={(value) =>
              updateVisita({ boletim: { ...visita.boletim, [key]: value } })
            }
          />
        ))}
        {[
          ["imovelInformado", "Morador orientado / imóvel informado"],
          ["quarteiraoConcluido", "Quarteirão concluído nesta visita"],
        ].map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            value={!!visita.boletim?.[key]}
            onChange={(value) =>
              updateVisita({ boletim: { ...visita.boletim, [key]: value } })
            }
          />
        ))}
      </Disclosure>
      <Disclosure
        title="Detalhes do imóvel"
        validationKeys={["complemento", "numeroQuartos"]}
        summary={
          [visita.tipoImovel, visita.complemento].filter(Boolean).join(" · ") ||
          "Tipo, complemento, lado da rua e quartos"
        }
      >
        <SelectField
          label="Tipo do imóvel"
          value={visita.tipoImovel || ""}
          onChange={(tipoImovel) => updateVisita({ tipoImovel })}
          options={[
            "Residencial",
            "Comercial",
            "Terreno baldio",
            "Ponto estratégico",
            "Outros",
          ].map((value) => ({ label: value, value }))}
        />
        <Field
          label="Complemento"
          name="complemento"
          value={visita.complemento || ""}
          onChangeText={(complemento) => updateVisita({ complemento })}
          maxLength={255}
        />
        <Choice
          label="Lado da rua"
          value={visita.lado || ""}
          options={[
            { label: "Direito", value: "D" },
            { label: "Esquerdo", value: "E" },
            { label: "Não informado", value: "" },
          ]}
          onChange={(lado) => updateVisita({ lado })}
        />
        {normal && (
          <Field
            testID="visit-rooms"
            name="numeroQuartos"
            label="Número de quartos"
            keyboardType="number-pad"
            value={String(visita.numeroQuartos ?? "")}
            onChangeText={(numeroQuartos) => updateVisita({ numeroQuartos })}
          />
        )}
      </Disclosure>
      {submitted && !!String(visita.nome || "").trim() && (
        <ErrorText>{addressError(visita)}</ErrorText>
      )}
    </VisitScreen>
  );
}
