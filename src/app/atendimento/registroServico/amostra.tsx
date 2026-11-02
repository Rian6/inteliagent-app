import LaboratoryFields from "@root/components/reports/LaboratoryFields";
import { useState } from "react";
import { Image, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text, Button, Choice, Field, ErrorText } from "@root/components/ui";
import VisitScreen from "@root/components/visitas/VisitScreen";
import { goVisit } from "@root/components/visitas/visitNavigation";
import useVisitaStore from "@root/context/visitaContext";
export default function Sample() {
  const { visita, updateVisita } = useVisitaStore(),
    [error, setError] = useState("");
  const images: string[] = visita.amostra.imagens || [];
  async function addPhoto() {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.15,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (
        !asset.base64 ||
        asset.base64.length > 119977 ||
        (asset.mimeType && asset.mimeType !== "image/jpeg")
      )
        throw new Error(
          "Escolha uma foto JPEG de até 90 KB. Recorte a imagem para reduzir o tamanho.",
        );
      const sample = useVisitaStore.getState().visita.amostra;
      if ((sample.imagens || []).length >= 2)
        throw new Error("Você já adicionou duas fotos.");
      updateVisita({
        amostra: {
          ...sample,
          imagens: [
            ...(sample.imagens || []),
            "data:image/jpeg;base64," + asset.base64,
          ],
        },
      });
    } catch (cause) {
      setError(cause.message || "Não foi possível adicionar a foto.");
    }
  }
  return (
    <VisitScreen
      page="amostra"
      title="Coleta de amostras"
      primaryLabel="Continuar para tratamento"
      onPrimary={() => goVisit("tratamento")}
    >
      <View style={{ gap: 8 }}>
        <Text bold>Houve coleta nesta visita?</Text>
        <Choice
          label="Foi coletada amostra?"
          value={
            visita.contemAmostra ? "yes" : visita.__sampleAnswered ? "no" : ""
          }
          onChange={(value) =>
            updateVisita({
              contemAmostra: value === "yes",
              __sampleAnswered: true,
            })
          }
          options={[
            { label: "Não", value: "no" },
            { label: "Sim", value: "yes" },
          ]}
        />
      </View>
      {visita.contemAmostra && (
        <>
          {[
            ["numeroInicio", "Número inicial"],
            ["numeroFinal", "Número final"],
            ["quantidade", "Quantidade de tubitos"],
          ].map(([key, label]) => (
            <Field
              key={key}
              name={`amostra.${key}`}
              label={label}
              keyboardType="number-pad"
              value={String(visita.amostra[key] ?? 0)}
              onChangeText={(value) =>
                updateVisita({ amostra: { ...visita.amostra, [key]: value } })
              }
            />
          ))}
          <View style={{ gap: 10 }}>
            <Text bold>Fotos ({images.length}/2)</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {images.map((uri, index) => (
                <View key={index} style={{ flex: 1, gap: 4 }}>
                  <Image
                    source={{ uri }}
                    accessibilityLabel={`Foto da amostra ${index + 1}`}
                    resizeMode="contain"
                    style={{ height: 120, width: "100%", borderRadius: 12 }}
                  />
                  <Button
                    variant="danger"
                    icon="trash-can-outline"
                    label={`Remover foto ${index + 1}`}
                    onPress={() =>
                      updateVisita({
                        amostra: {
                          ...visita.amostra,
                          imagens: images.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Remover
                  </Button>
                </View>
              ))}
            </View>
            <Button
              variant="secondary"
              icon="image-plus"
              disabled={images.length >= 2}
              onPress={addPhoto}
            >
              Adicionar foto
            </Button>
            <Text small muted>
              Até duas fotos JPEG de 90 KB.
            </Text>
          </View>
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <LaboratoryFields
        value={visita.boletim?.laboratorio}
        onChange={(laboratorio) =>
          updateVisita({ boletim: { ...visita.boletim, laboratorio } })
        }
      />
    </VisitScreen>
  );
}
