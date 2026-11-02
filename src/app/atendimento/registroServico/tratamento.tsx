import { View } from "react-native";
import { Text, Choice, Field, Toggle, Disclosure } from "@root/components/ui";
import VisitScreen from "@root/components/visitas/VisitScreen";
import { goVisit } from "@root/components/visitas/visitNavigation";
import useVisitaStore from "@root/context/visitaContext";
export default function Treatment() {
  const { visita, updateVisita } = useVisitaStore(),
    treatment = visita.tratamento;
  const update = (patch: Record<string, any>) =>
    updateVisita({ tratamento: { ...treatment, ...patch } });
  function updateMode(mode: string, patch: Record<string, any>) {
    const legacy = !treatment.focal && !treatment.perifocal;
    const current = treatment[mode] || {
      ativo: false,
      tipo: legacy ? treatment.tipo || "" : "",
      quantidadeCarga: legacy ? treatment.quantidadeCarga || 0 : 0,
      quantidadeTratamento: legacy ? treatment.quantidadeTratamento || 0 : 0,
    };
    update({ [mode]: { ...current, ...patch } });
  }
  return (
    <VisitScreen
      page="tratamento"
      title="Tratamento do imóvel"
      primaryLabel="Revisar visita"
      onPrimary={() => goVisit("revisao")}
      testID="visit-treatment-scroll"
    >
      <View style={{ gap: 8 }}>
        <Text bold>Foi realizado tratamento?</Text>
        <Choice
          label="Foi necessário efetuar tratamento?"
          value={
            visita.contemTratamento
              ? "yes"
              : visita.__treatmentAnswered
                ? "no"
                : ""
          }
          onChange={(value) =>
            updateVisita({
              contemTratamento: value === "yes",
              __treatmentAnswered: true,
            })
          }
          options={[
            { label: "Não", value: "no" },
            { label: "Sim", value: "yes" },
          ]}
        />
      </View>
      {visita.contemTratamento && (
        <>
          <Field
            testID="treatment-deposits"
            name="tratamento.depositosEliminados"
            label="Depósitos eliminados"
            keyboardType="number-pad"
            value={String(treatment.depositosEliminados ?? 0)}
            onChangeText={(depositosEliminados) =>
              update({ depositosEliminados })
            }
          />
          <Field
            name="tratamento.imoveisTratados"
            label="Imóveis tratados"
            keyboardType="number-pad"
            value={String(treatment.imoveisTratados ?? 0)}
            onChangeText={(imoveisTratados) => update({ imoveisTratados })}
          />
          {!treatment.focal && !treatment.perifocal && !!treatment.tipo && (
            <Disclosure
              title="Tratamento já registrado"
              summary={treatment.tipo}
              initiallyOpen
            >
              <Field
                label="Tipo de tratamento registrado"
                value={treatment.tipo}
                onChangeText={(tipo) => update({ tipo })}
              />
              <Field
                label="Quantidade da carga registrada"
                name="tratamento.quantidadeCarga"
                keyboardType="number-pad"
                value={String(treatment.quantidadeCarga ?? 0)}
                onChangeText={(quantidadeCarga) => update({ quantidadeCarga })}
              />
              <Field
                label="Depósitos tratados registrados"
                name="tratamento.quantidadeTratamento"
                keyboardType="number-pad"
                value={String(treatment.quantidadeTratamento ?? 0)}
                onChangeText={(quantidadeTratamento) =>
                  update({ quantidadeTratamento })
                }
              />
            </Disclosure>
          )}
          {(
            [
              [
                "focal",
                "Tratamento focal (larvicida)",
                "Tipo de larvicida (L1)",
              ],
              [
                "perifocal",
                "Tratamento perifocal (adulticida)",
                "Tipo de adulticida",
              ],
            ] as const
          ).map(([mode, title, typeLabel]) => (
            <View key={mode} style={{ gap: 14 }}>
              <Toggle
                testID={`treatment-${mode}`}
                label={title}
                value={!!treatment[mode]?.ativo}
                onChange={(ativo) => updateMode(mode, { ativo })}
              />
              {treatment[mode]?.ativo && (
                <>
                  <Field
                    testID={`treatment-${mode}-type`}
                    name={`tratamento.${mode}.tipo`}
                    label={typeLabel}
                    value={String(treatment[mode]?.tipo || "")}
                    onChangeText={(tipo) => updateMode(mode, { tipo })}
                  />
                  <Field
                    testID={`treatment-${mode}-load`}
                    name={`tratamento.${mode}.quantidadeCarga`}
                    label={`Quantidade da carga ${mode}`}
                    keyboardType="number-pad"
                    value={String(treatment[mode]?.quantidadeCarga ?? 0)}
                    onChangeText={(quantidadeCarga) =>
                      updateMode(mode, { quantidadeCarga })
                    }
                  />
                  <Field
                    label={`Depósitos tratados ${mode}`}
                    name={`tratamento.${mode}.quantidadeTratamento`}
                    keyboardType="number-pad"
                    value={String(treatment[mode]?.quantidadeTratamento ?? 0)}
                    onChangeText={(quantidadeTratamento) =>
                      updateMode(mode, { quantidadeTratamento })
                    }
                  />
                </>
              )}
            </View>
          ))}
          {treatment.focal?.ativo && (
            <Field
              name="boletim.focalGramas"
              label="Larvicida L1 aplicado (g, para o boletim)"
              keyboardType="decimal-pad"
              value={String(visita.boletim?.focalGramas ?? "")}
              onChangeText={(focalGramas) =>
                updateVisita({ boletim: { ...visita.boletim, focalGramas } })
              }
            />
          )}
          <Disclosure
            validationKeys={[
              "boletim.focal2.tipo",
              "boletim.focal2.gramas",
              "boletim.focal2.depositos",
            ]}
            title="Segundo produto focal (L2)"
            summary="Preencha apenas quando houver um segundo larvicida"
          >
            {[
              ["tipo", "Tipo de larvicida L2"],
              ["gramas", "Quantidade de larvicida L2 (g)"],
              ["depositos", "Depósitos tratados L2"],
            ].map(([key, label]) => (
              <Field
                key={key}
                name={"boletim.focal2." + key}
                label={label}
                keyboardType={key === "tipo" ? "default" : "decimal-pad"}
                value={String(visita.boletim?.focal2?.[key] ?? "")}
                onChangeText={(value) =>
                  updateVisita({
                    boletim: {
                      ...visita.boletim,
                      focal2: { ...visita.boletim?.focal2, [key]: value },
                    },
                  })
                }
              />
            ))}
          </Disclosure>
        </>
      )}
    </VisitScreen>
  );
}
