export const visitStatus = (value: unknown) =>
  ({ N: 3, R: 2, F: 1 })[String(value)] ?? Number(value ?? 3);
export const newVisit = (
  values: Record<string, any> = {},
): Record<string, any> => ({
  id: "",
  idPlanejamento: "",
  primeiraVisita: null,
  segundaVisita: null,
  numeroQuartos: 0,
  contemAmostra: false,
  contemTratamento: false,
  cep: "",
  boletim: {},
  nome: "",
  numero: "",
  complemento: "",
  lado: "",
  tipoImovel: "",
  itensInspecionados: [],
  depositosInspecionados: {},
  ...values,
  tipoVisita: values.tipoVisita || "N",
  situacaoVisita: visitStatus(values.situacaoVisita),
  amostra: {
    numeroInicio: 0,
    numeroFinal: 0,
    quantidade: 0,
    imagens: [],
    ...values.amostra,
  },
  tratamento: {
    depositosEliminados: 0,
    imoveisTratados: 0,
    quantidadeTratamento: 0,
    tipo: "",
    quantidadeCarga: 0,
    ...values.tratamento,
  },
});
// The existing sync contract supports several treatments per visit. Store each
// modality separately in TIPO so focal and perifocal data cannot overwrite one another.
export const treatmentMode = (type: string) =>
  String(type || "").startsWith("FOCAL:")
    ? "focal"
    : String(type || "").startsWith("PERIFOCAL:")
      ? "perifocal"
      : "legacy";
const number = (value, label) => {
  const result = Number(value ?? 0);
  if (!Number.isSafeInteger(result) || result < 0 || result > 1000000)
    throw new Error(`${label}: informe um número inteiro entre 0 e 1000000.`);
  return result;
};
const date = (value, fallback = null) => {
  if (!value) return fallback;
  const parsed = new Date(
    typeof value === "string" ? value.replace(" ", "T") : value,
  );
  if (!Number.isFinite(parsed.getTime()))
    throw new Error("Data de visita inválida");
  const pad = (value) => String(value).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
};
export class VisitDrafts {
  db: import("./contracts").OfflineDatabase;
  now: () => number;
  constructor(db, now = Date.now) {
    this.db = db;
    this.now = now;
  }
  save(visit) {
    if (!visit.id) return Promise.resolve();
    return this.db.transaction((tx) =>
      tx.runAsync(
        "INSERT INTO VISITA_DRAFTS(ID,PLAN_ID,PAYLOAD_JSON,UPDATED_AT) VALUES(?,?,?,?) ON CONFLICT(ID) DO UPDATE SET PLAN_ID=excluded.PLAN_ID,PAYLOAD_JSON=excluded.PAYLOAD_JSON,UPDATED_AT=excluded.UPDATED_AT",
        [
          visit.id,
          visit.idPlanejamento || null,
          JSON.stringify(visit),
          this.now(),
        ],
      ),
    );
  }
  async get(id) {
    const row = await this.db.getFirstAsync(
      "SELECT PAYLOAD_JSON FROM VISITA_DRAFTS WHERE ID=?",
      [id],
    );
    return row ? JSON.parse(row.PAYLOAD_JSON) : null;
  }
  async list() {
    return (
      await this.db.getAllAsync(
        "SELECT ID,PAYLOAD_JSON,UPDATED_AT FROM VISITA_DRAFTS ORDER BY UPDATED_AT DESC",
      )
    ).map((row) => ({
      id: row.ID,
      updatedAt: row.UPDATED_AT,
      visit: JSON.parse(row.PAYLOAD_JSON),
    }));
  }
}
export class Visits {
  engine: import("./engine").OfflineEngine;
  db: import("./contracts").OfflineDatabase;
  drafts: VisitDrafts;
  constructor(engine) {
    this.engine = engine;
    this.db = engine.db;
    this.drafts = new VisitDrafts(this.db, engine.now);
  }
  async save(input) {
    const visit = newVisit(input),
      id = visit.id || this.engine.uuid();
    if (!visit.idPlanejamento)
      throw new Error("Selecione um planejamento antes de registrar a visita.");
    if (!String(visit.nome || "").trim() || String(visit.nome).length > 255)
      throw new Error("Informe um endereço de até 255 caracteres.");
    if (String(visit.numero || "").length > 32)
      throw new Error("Número do imóvel muito longo.");
    const status = Number(visit.situacaoVisita);
    if (![1, 2, 3, 4, 5].includes(status))
      throw new Error("Selecione a situação da visita.");
    const inspections = [
      ...new Set(visit.itensInspecionados || visit.inspecoes || []),
    ].map((value) => number(value, "Inspeção"));
    if (inspections.some((type) => type < 1 || type > 7))
      throw new Error("Tipo de depósito inválido.");
    if (!["N", "R"].includes(visit.tipoVisita))
      throw new Error("Selecione visita normal ou retorno.");
    const quantities = Object.fromEntries(
      inspections.map((type) => [
        type,
        number(visit.depositosInspecionados?.[type], "Depósitos inspecionados"),
      ]),
    );
    const sample: Record<string, any> = visit.contemAmostra
      ? {
          NUMERO_INICIO: number(visit.amostra.numeroInicio, "Número inicial"),
          NUMERO_FINAL: number(visit.amostra.numeroFinal, "Número final"),
          QUANTIDADE: number(visit.amostra.quantidade, "Quantidade"),
        }
      : {};
    if (visit.contemAmostra && sample.NUMERO_FINAL < sample.NUMERO_INICIO)
      throw new Error(
        "O número final da amostra precisa ser maior ou igual ao inicial.",
      );
    const images = visit.amostra.imagens || [];
    if (
      images.length > 2 ||
      images.some(
        (image) =>
          typeof image !== "string" ||
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image) ||
          image.length > 120000,
      )
    )
      throw new Error("Adicione até duas fotos JPEG de até 90 KB cada.");
    if (visit.contemAmostra) sample.IMAGENS_JSON = JSON.stringify(images);
    const treatment = visit.contemTratamento
      ? {
          DEPOSITOS_ELIMINADOS: number(
            visit.tratamento.depositosEliminados,
            "Depósitos eliminados",
          ),
          IMOVEIS_TRATADOS: number(
            visit.tratamento.imoveisTratados,
            "Imóveis tratados",
          ),
          QTD_TRATAMENTO: number(
            visit.tratamento.quantidadeTratamento,
            "Quantidade de tratamento",
          ),
          TIPO: String(visit.tratamento.tipo || ""),
          QTD_CARGA: number(
            visit.tratamento.quantidadeCarga,
            "Quantidade de carga",
          ),
        }
      : {};
    const modalities = ["focal", "perifocal"].filter(
      (mode) => visit.tratamento[mode]?.ativo,
    );
    const treatments = visit.contemTratamento
      ? modalities.length
        ? modalities.map((mode, index) => ({
            ...treatment,
            DEPOSITOS_ELIMINADOS:
              index === 0 ? treatment.DEPOSITOS_ELIMINADOS : 0,
            IMOVEIS_TRATADOS: index === 0 ? treatment.IMOVEIS_TRATADOS : 0,
            TIPO:
              (mode === "focal" ? "FOCAL:" : "PERIFOCAL:") +
              String(visit.tratamento[mode].tipo || "").trim(),
            QTD_CARGA: number(
              visit.tratamento[mode].quantidadeCarga,
              "Quantidade da carga",
            ),
            QTD_TRATAMENTO: number(
              visit.tratamento[mode].quantidadeTratamento,
              "Depósitos tratados",
            ),
          }))
        : visit.tratamento.focal || visit.tratamento.perifocal
          ? treatment.DEPOSITOS_ELIMINADOS || treatment.IMOVEIS_TRATADOS
            ? [{ ...treatment, TIPO: "", QTD_CARGA: 0, QTD_TRATAMENTO: 0 }]
            : []
          : [treatment]
      : [];
    await this.engine.transaction(
      async (tx) => {
        const plan = await tx.db.getFirstAsync(
          "SELECT ID FROM PLANEJAMENTO WHERE ID=? AND COALESCE(SITUACAO,1)<>0",
          [visit.idPlanejamento],
        );
        if (!plan)
          throw new Error(
            "Planejamento não está disponível neste dispositivo. Sincronize antes de sair para campo.",
          );
        const previous = await tx.db.getFirstAsync(
          "SELECT ID_PLANEJAMENTO,PRIMEIRA_VISITA,SEGUNDA_VISITA,SEQUENCIA,LATITUDE,LONGITUDE FROM VISITA WHERE ID=?",
          [id],
        );
        if (previous && previous.ID_PLANEJAMENTO !== visit.idPlanejamento)
          throw new Error("Esta visita pertence a outro planejamento.");
        if (!previous && !this.engine.user.permissions?.addVisits)
          throw new Error(
            "Você não tem permissão para adicionar visitas a planejamentos.",
          );
        // Recording an existing visit keeps the route order. Use reorder() to change it.
        const last = await tx.db.getFirstAsync(
          "SELECT COALESCE(MAX(SEQUENCIA),0) AS N FROM VISITA WHERE ID_PLANEJAMENTO=?",
          [visit.idPlanejamento],
        );
        await tx.save("VISITA", {
          ID: id,
          ID_PLANEJAMENTO: visit.idPlanejamento,
          PRIMEIRA_VISITA: date(
            visit.primeiraVisita,
            previous?.PRIMEIRA_VISITA || date(new Date(this.engine.now())),
          ),
          SEGUNDA_VISITA: date(visit.segundaVisita, null),
          TIPO_VISITA: visit.tipoVisita || "N",
          NUMERO_QUARTOS: number(visit.numeroQuartos, "Número de quartos"),
          CONTEM_AMOSTRA: Number(!!visit.contemAmostra),
          CONTEM_TRATAMENTO: Number(treatments.length > 0),
          SITUACAO_REFERENCIA: status,
          SEQUENCIA: previous ? previous.SEQUENCIA : Number(last?.N || 0) + 1,
          LATITUDE: visit.latitude ?? previous?.LATITUDE ?? null,
          LONGITUDE: visit.longitude ?? previous?.LONGITUDE ?? null,
          BOLETIM_JSON: JSON.stringify(visit.boletim || {}),
          CEP: visit.cep || "",
          NOME: String(visit.nome).trim(),
          NUMERO: String(visit.numero || ""),
          COMPLEMENTO: visit.complemento || "",
          LADO: visit.lado || "",
          TIPO_IMOVEL: visit.tipoImovel || "",
          SITUACAO: 1,
        });
        const existing = await tx.db.getAllAsync(
          "SELECT * FROM INSPECAO WHERE ID_VISITA=?",
          [id],
        );
        for (const row of existing) {
          if (!inspections.includes(row.TIPO) && row.SITUACAO !== 0)
            await tx.save("INSPECAO", { ...row, SITUACAO: 0 });
        }
        for (const type of inspections) {
          const row = existing.find((item) => item.TIPO === type);
          await tx.save("INSPECAO", {
            ID: row?.ID || this.engine.uuid(),
            ID_VISITA: id,
            TIPO: type,
            NUMERO_DEPOSITOS: quantities[type],
            SITUACAO: 1,
          });
        }
        const oldSamples = await tx.db.getAllAsync(
          "SELECT * FROM AMOSTRA WHERE ID_VISITA=? ORDER BY rowid DESC",
          [id],
        );
        if (visit.contemAmostra)
          await tx.save("AMOSTRA", {
            ID: oldSamples[0]?.ID || this.engine.uuid(),
            ID_VISITA: id,
            ...sample,
            SITUACAO: 1,
          });
        for (const old of oldSamples.slice(visit.contemAmostra ? 1 : 0))
          if (old.SITUACAO !== 0)
            await tx.save("AMOSTRA", { ...old, SITUACAO: 0 });
        const oldTreatments = await tx.db.getAllAsync(
          "SELECT * FROM TRATAMENTO WHERE ID_VISITA=? ORDER BY rowid DESC",
          [id],
        );
        const retained = new Set<string>();
        for (const treatmentRow of treatments) {
          const mode = treatmentMode(String(treatmentRow.TIPO || ""));
          const old = oldTreatments.find(
            (row) => treatmentMode(row.TIPO) === mode,
          );
          const treatmentId = old?.ID || this.engine.uuid();
          retained.add(treatmentId);
          await tx.save("TRATAMENTO", {
            ID: treatmentId,
            ID_VISITA: id,
            ...treatmentRow,
            SITUACAO: 1,
          });
        }
        for (const old of oldTreatments)
          if (!retained.has(old.ID) && old.SITUACAO !== 0)
            await tx.save("TRATAMENTO", { ...old, SITUACAO: 0 });
        await tx.db.runAsync("DELETE FROM VISITA_DRAFTS WHERE ID=?", [id]);
      },
      { aggregateKey: `VISITA:${id}` },
    );
    return id;
  }
  async reorder(planId: string, ids: string[]) {
    if (!this.engine.user.permissions?.reorderVisits)
      throw new Error(
        "Você não tem permissão para alterar a ordem das visitas.",
      );
    await this.engine.transaction(async (tx) => {
      const rows = await tx.db.getAllAsync(
        "SELECT * FROM VISITA WHERE ID_PLANEJAMENTO=? AND COALESCE(SITUACAO,1)<>0",
        [planId],
      );
      if (
        new Set(ids).size !== ids.length ||
        ids.length !== rows.length ||
        rows.some((row) => !ids.includes(row.ID))
      )
        throw new Error(
          "A lista de visitas mudou. Atualize a rota e tente novamente.",
        );
      for (let index = 0; index < ids.length; index++) {
        const row = rows.find((row) => row.ID === ids[index]);
        if (row.SEQUENCIA !== index + 1)
          await tx.save("VISITA", {
            ID: row.ID,
            ID_PLANEJAMENTO: planId,
            SEQUENCIA: index + 1,
          });
      }
    });
  }
  async load(id) {
    const draft = await this.drafts.get(id);
    if (draft) return draft;
    const row = await this.db.getFirstAsync("SELECT * FROM VISITA WHERE ID=?", [
      id,
    ]);
    if (!row) return null;
    const [inspections, sample, treatment] = await Promise.all([
      this.db.getAllAsync(
        "SELECT TIPO,NUMERO_DEPOSITOS FROM INSPECAO WHERE ID_VISITA=? AND COALESCE(SITUACAO,1)<>0",
        [id],
      ),
      this.db.getFirstAsync(
        "SELECT * FROM AMOSTRA WHERE ID_VISITA=? AND COALESCE(SITUACAO,1)<>0 LIMIT 1",
        [id],
      ),
      this.db.getAllAsync(
        "SELECT * FROM TRATAMENTO WHERE ID_VISITA=? AND COALESCE(SITUACAO,1)<>0 ORDER BY rowid",
        [id],
      ),
    ]);
    return newVisit({
      boletim: JSON.parse(row.BOLETIM_JSON || "{}"),
      id: row.ID,
      idPlanejamento: row.ID_PLANEJAMENTO,
      primeiraVisita: row.PRIMEIRA_VISITA,
      segundaVisita: row.SEGUNDA_VISITA,
      tipoVisita: row.TIPO_VISITA,
      numeroQuartos: row.NUMERO_QUARTOS,
      contemAmostra: !!row.CONTEM_AMOSTRA,
      contemTratamento: !!row.CONTEM_TRATAMENTO,
      situacaoVisita: row.SITUACAO_REFERENCIA || 3,
      cep: row.CEP,
      nome: row.NOME,
      numero: row.NUMERO,
      complemento: row.COMPLEMENTO,
      lado: row.LADO,
      tipoImovel: row.TIPO_IMOVEL,
      sequencia: row.SEQUENCIA,
      latitude: row.LATITUDE,
      longitude: row.LONGITUDE,
      itensInspecionados: inspections.map((item) => item.TIPO),
      depositosInspecionados: Object.fromEntries(
        inspections.map((item) => [item.TIPO, item.NUMERO_DEPOSITOS ?? 0]),
      ),
      amostra: sample
        ? {
            numeroInicio: sample.NUMERO_INICIO,
            numeroFinal: sample.NUMERO_FINAL,
            quantidade: sample.QUANTIDADE,
            imagens: JSON.parse(sample.IMAGENS_JSON || "[]"),
          }
        : undefined,
      tratamento: treatment.length
        ? {
            depositosEliminados: treatment.reduce(
              (sum, item) => sum + Number(item.DEPOSITOS_ELIMINADOS || 0),
              0,
            ),
            imoveisTratados: treatment.reduce(
              (sum, item) => sum + Number(item.IMOVEIS_TRATADOS || 0),
              0,
            ),
            quantidadeTratamento: treatment[0].QTD_TRATAMENTO,
            tipo: treatment[0].TIPO,
            quantidadeCarga: treatment[0].QTD_CARGA,
            ...Object.fromEntries(
              treatment
                .filter((item) => treatmentMode(item.TIPO) !== "legacy")
                .map((item) => [
                  treatmentMode(item.TIPO),
                  {
                    ativo: true,
                    tipo: item.TIPO.substring(item.TIPO.indexOf(":") + 1),
                    quantidadeCarga: item.QTD_CARGA,
                    quantidadeTratamento: item.QTD_TRATAMENTO,
                  },
                ]),
            ),
          }
        : undefined,
    });
  }
}
