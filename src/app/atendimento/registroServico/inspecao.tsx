import { useState } from "react";
import { Image, View, Modal } from "react-native";
import {
  Text,
  Button,
  CheckRow,
  Quantity,
  Divider,
  Heading,
  Choice,
  Toggle,
} from "@root/components/ui";
import VisitScreen from "@root/components/visitas/VisitScreen";
import { goVisit } from "@root/components/visitas/visitNavigation";
import useVisitaStore from "@root/context/visitaContext";
import { inspectionItems } from "@root/data/inspection-items";
import { colors as c } from "@root/theme";
export default function Inspection() {
  const { visita, updateVisita } = useVisitaStore(),
    selected: number[] = visita.itensInspecionados || [];
  const [reference, setReference] = useState<
    (typeof inspectionItems)[number] | null
  >(null);
  return (
    <VisitScreen
      page="inspecao"
      title="Inspeção do imóvel"
      primaryLabel="Continuar para amostras"
      onPrimary={() => goVisit("amostra")}
      testID="visit-inspection-scroll"
    >
      <Toggle label="Imóvel inspecionado para levantamento de índice (LI)" value={!!visita.boletim?.inspecionadoLI} onChange={inspecionadoLI=>updateVisita({boletim:{...visita.boletim,inspecionadoLI}})}/>
      <Text bold>Foram encontrados depósitos?</Text>
      <Choice
        label="Foram encontrados depósitos?"
        value={
          selected.length || visita.__inspectionHasDeposits
            ? "yes"
            : visita.__inspectionAnswered
              ? "no"
              : ""
        }
        options={[
          { label: "Não", value: "no" },
          { label: "Sim", value: "yes" },
        ]}
        onChange={(value) =>
          updateVisita({
            __inspectionAnswered: true,
            __inspectionHasDeposits: value === "yes",
            ...(value === "no" ? { itensInspecionados: [] } : {}),
          })
        }
      />
      {selected.length > 0 || visita.__inspectionHasDeposits ? (
        <>
          <View style={{ gap: 2 }}>
            <Text bold>Depósitos inspecionados</Text>
            <Text muted small>
              Marque os tipos encontrados e ajuste a quantidade.
            </Text>
          </View>
          <View>
            {inspectionItems.map((item) => (
              <View
                key={item.id}
                style={{ borderBottomWidth: 1, borderColor: c.outlineVariant }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <CheckRow
                    testID={`inspection-${item.id}`}
                    label={`${item.code} · ${item.label}`}
                    selected={selected.includes(item.id)}
                    onPress={() =>
                      updateVisita({
                        itensInspecionados: selected.includes(item.id)
                          ? selected.filter((id) => id !== item.id)
                          : [...selected, item.id],
                        depositosInspecionados: {
                          ...visita.depositosInspecionados,
                          [item.id]:
                            visita.depositosInspecionados?.[item.id] ?? 0,
                        },
                      })
                    }
                  >
                    <Image
                      source={item.image}
                      resizeMode="contain"
                      accessible={false}
                      style={{ width: 32, height: 32 }}
                    />
                  </CheckRow>
                  <Button
                    variant="ghost"
                    icon="information-outline"
                    label={`Ver exemplo ${item.code}`}
                    onPress={() => setReference(item)}
                  style={{ width: 48, minHeight: 48, paddingHorizontal: 12 }}
                  />
                </View>
                {selected.includes(item.id) && (
                  <View
                    style={{
                      paddingBottom: 12,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text small muted>
                      Quantidade
                    </Text>
                    <Quantity
                      name={`depositos.${item.id}`}
                      label={`Depósitos inspecionados ${item.code}`}
                      value={visita.depositosInspecionados?.[item.id] ?? 0}
                      onChange={(value) =>
                        updateVisita({
                          depositosInspecionados: {
                            ...visita.depositosInspecionados,
                            [item.id]: value,
                          },
                        })
                      }
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text muted small>
          Informe se encontrou depósitos. Se não encontrou, você poderá seguir
          para a coleta de amostras.
        </Text>
      )}
      <Modal
        visible={!!reference}
        transparent
        animationType="fade"
        onRequestClose={() => setReference(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#10241FB3",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: 20,
              padding: 20,
              gap: 16,
            }}
          >
            {reference && (
              <>
                <Heading>{reference.code}</Heading>
                <Text>{reference.label}</Text>
                <Image
                  source={reference.image}
                  resizeMode="contain"
                  accessibilityLabel={`Exemplo de depósito ${reference.code}`}
                  style={{ width: "100%", height: 220 }}
                />
              </>
            )}
            <Button onPress={() => setReference(null)}>Entendi</Button>
          </View>
        </View>
      </Modal>
    </VisitScreen>
  );
}
