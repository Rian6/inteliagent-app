import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import FormScreen from "@root/components/_default/screen/FormScreen";
import { Button, Heading, Text, ErrorText } from "@root/components/ui";

import { database } from "@root/offline/database";
import { getPlanejamentoById } from "@root/db/atendimentoPersistence";
import { createDailyReport } from "@root/reports/pncd";
import catalog from "@root/data/planning-catalog.json";
export default function DailyReport() {
  const { idPlanejamento } = useLocalSearchParams();
  const [plan, setPlan] = useState<any>(null),
    [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setPlan(null);
    setRows([]);
    (async () => {
      try {
        const p = await getPlanejamentoById(String(idPlanejamento));
        if (!p) throw Error("Planejamento não encontrado.");
        const visits = await database.getAllAsync(
          "SELECT * FROM VISITA WHERE ID_PLANEJAMENTO=? AND COALESCE(SITUACAO,1)<>0 ORDER BY PRIMEIRA_VISITA,SEQUENCIA,ID",
          [String(idPlanejamento)],
        );
        const all = await Promise.all(
          visits.map(async (v) => ({
            ...v,
            ...Object.fromEntries(
              await Promise.all(
                ["INSPECAO", "AMOSTRA", "TRATAMENTO"].map(async (table) => [
                  table.toLowerCase(),
                  await database.getAllAsync(
                    "SELECT * FROM " +
                      table +
                      " WHERE ID_VISITA=? AND COALESCE(SITUACAO,1)<>0",
                    [v.ID],
                  ),
                ]),
              ),
            ),
          })),
        );
        if (active) {
          setPlan(p);
          setRows(all);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [idPlanejamento]);
  async function generate() {
    if (busy || !plan) return;
    setBusy(true);
    setError("");
    try {
      const report = await createDailyReport(plan, rows, catalog);
      const file = new File(Paths.cache, report.filename);
      file.create({ overwrite: true });
      file.write(report.bytes);
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: "Salvar ou compartilhar boletim",
        });
      else await Print.printAsync({ uri: file.uri });
    } catch (e) {
      setError(e.message || "Não foi possível gerar o PDF.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormScreen safeArea={false} bottomSafeArea>
      <Text bold>{plan?.nome || "Relatório do planejamento"}</Text>
      <Text muted>
        Até 20 imóveis por folha, separados por dia e agente. O documento usa os
        atendimentos concluídos deste aparelho.
      </Text>
      <Text muted>
        Frente e verso preenchidos com os dados salvos no planejamento e nas
        visitas. Para corrigir informações, atualize o cadastro antes de baixar.
      </Text>
      <ErrorText>{error}</ErrorText>
      {!!error && (
        <Button
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/atendimento/visitas",
              params: { idPlanejamento: String(idPlanejamento) },
            })
          }
        >
          Revisar visitas
        </Button>
      )}
      {!!error && (
        <Button
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/atendimento",
              params: { id: String(idPlanejamento) },
            })
          }
        >
          Revisar planejamento
        </Button>
      )}
      <Button icon="file-pdf-box" loading={busy} onPress={generate}>
        Gerar e compartilhar PDF
      </Button>
      <Text muted small>
        Assinaturas ficam em branco para assinatura manual. Rascunhos e visitas
        ainda não realizadas ficam fora.
      </Text>
    </FormScreen>
  );
}
