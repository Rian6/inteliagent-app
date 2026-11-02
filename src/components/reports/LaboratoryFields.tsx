import { View } from "react-native";
import { Disclosure, Toggle, Field, Text } from "@root/components/ui";
import {
  depositTypes,
  laboratorySpecies,
  laboratoryErrors,
} from "@root/reports/daily-summary";
export default function LaboratoryFields({
  value = {},
  onChange,
}: {
  value?: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}) {
  const set = (key: string, val: any) => onChange({ ...value, [key]: val });
  const speciesField = (species: string, key: string, val: any) =>
    set(species, { ...value[species], [key]: val });
  const errors = Object.keys(laboratoryErrors({ laboratorio: value }));
  return (
    <Disclosure
      title="Resultado do laboratório"
      summary="Preencha após a análise da amostra"
      validationKeys={errors}
    >
      <Toggle
        label="Análise laboratorial concluída"
        value={!!value.concluido}
        onChange={(v) => set("concluido", v)}
      />
      {value.concluido && (
        <View style={{ gap: 16 }}>
          <Text muted>
            Registre os resultados confirmados. As quantidades iniciam em zero.
          </Text>
          {[
            ["dataEntrada", "Data de entrada (AAAA-MM-DD)"],
            ["dataConclusao", "Data de conclusão (AAAA-MM-DD)"],
            ["nome", "Laboratório"],
            ["laboratorista", "Laboratorista"],
          ].map(([key, label]) => (
            <Field
              key={key}
              name={"boletim.laboratorio." + key}
              label={label}
              value={value[key] || ""}
              onChangeText={(val) => set(key, val)}
              maxLength={key.startsWith("data") ? 10 : 120}
            />
          ))}
          {laboratorySpecies.map(([species, label]) => (
            <Disclosure
              key={species}
              title={label}
              validationKeys={errors.filter((key) =>
                key.includes("." + species + "."),
              )}
            >
              <Text muted>Depósitos com espécimes identificados</Text>
              {depositTypes.map((type) => (
                <Field
                  key={type}
                  name={"boletim.laboratorio." + species + "." + type}
                  label={"Depósitos " + type + " · " + label}
                  keyboardType="number-pad"
                  value={String(value[species]?.depositos?.[type] ?? 0)}
                  onChangeText={(val) =>
                    speciesField(species, "depositos", {
                      ...value[species]?.depositos,
                      [type]: val,
                    })
                  }
                />
              ))}
              {[
                ["larvas", "Larvas"],
                ["pupas", "Pupas"],
                ["exuvias", "Exúvias"],
                ["adultos", "Adultos"],
              ].map(([key, name]) => (
                <Field
                  key={key}
                  name={"boletim.laboratorio." + species + "." + key}
                  label={name + " · " + label}
                  keyboardType="number-pad"
                  value={String(value[species]?.[key] ?? 0)}
                  onChangeText={(val) => speciesField(species, key, val)}
                />
              ))}
            </Disclosure>
          ))}
        </View>
      )}
    </Disclosure>
  );
}
