import {laboratoryErrors} from '../reports/daily-summary.ts';
export type VisitPage =
  "index" | "inspecao" | "amostra" | "tratamento" | "revisao";
export const visitPath = (page: VisitPage) =>
  page === "index"
    ? "/atendimento/registroServico"
    : `/atendimento/registroServico/${page}`;
export function visitStages(
  status: unknown,
): { page: VisitPage; label: string }[] {
  return Number(status) === 3
    ? ([
        { page: "index", label: "Imóvel" },
        { page: "inspecao", label: "Inspeção" },
        { page: "amostra", label: "Amostras" },
        { page: "tratamento", label: "Tratamento" },
        { page: "revisao", label: "Revisão" },
      ] as const)
    : ([
        { page: "index", label: "Imóvel" },
        { page: "revisao", label: "Revisão" },
      ] as const);
}
export function addressError(visit: Record<string, any>) {
  if (!String(visit.nome || "").trim()) return "Informe o endereço do imóvel.";
  if (String(visit.nome).length > 255)
    return "Use até 255 caracteres para o endereço.";
  if (String(visit.numero || "").length > 32)
    return "Use até 32 caracteres para o número.";
  const other = visitPageErrors("index", visit);
  if (Object.keys(other).length) return Object.values(other)[0];
  return "";
}
export function resumedPage(visit: Record<string, any>): VisitPage {
  if (addressError(visit)) return "index";
  const page = visit.__page;
  if (!["index", "inspecao", "amostra", "tratamento", "revisao"].includes(page))
    return "index";
  if (
    Number(visit.situacaoVisita) !== 3 &&
    ["inspecao", "amostra", "tratamento"].includes(page)
  )
    return accessibleVisitPage("revisao", visit);
  return accessibleVisitPage(page, visit);
}
export function previousVisitPage(
  page: VisitPage,
  status: unknown,
): VisitPage | null {
  const stages = visitStages(status),
    index = stages.findIndex((s) => s.page === page);
  return index > 0 ? stages[index - 1].page : null;
}
export type VisitErrors = Record<string, string>;
const integerError = (value: unknown, required = false) => {
  if (value === "" || value == null)
    return required ? "Preencha este campo." : "";
  const n = Number(value);
  return !Number.isSafeInteger(n) || n < 0 || n > 1000000
    ? "Informe um número inteiro entre 0 e 1000000."
    : "";
};
export function visitPageErrors(
  page: VisitPage,
  v: Record<string, any>,
): VisitErrors {
  const errors: VisitErrors = {};
  const check = (key: string, value: unknown, required = false) => {
    const error = integerError(value, required);
    if (error) errors[key] = error;
  };
  if (page === "index") {
    const b = v.boletim || {};
    if (b.horaEntrada && !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.horaEntrada))
      errors["boletim.horaEntrada"] = "Use um horário válido no formato HH:MM.";
    for (const key of [
      "quarteirao",
      "ladoQuarteirao",
      "sequenciaQuarteirao",
      "sequenciaImovel",
    ])
      if (String(b[key] || "").length > 32)
        errors["boletim." + key] = "Use até 32 caracteres.";
    // Campos obrigatórios no registro diário PNCD/FAD: o PDF do boletim não pode
    // ser gerado sem eles, então o cadastro já bloqueia a continuidade.
    if (!String(b.quarteirao || "").trim())
      errors["boletim.quarteirao"] = "Informe o número do quarteirão.";
    if (!String(b.ladoQuarteirao || "").trim())
      errors["boletim.ladoQuarteirao"] = "Informe a face do quarteirão.";
    if (!String(b.agenteNome || "").trim())
      errors["boletim.agenteNome"] = "Informe o agente responsável.";
    if (!String(v.tipoImovel || "").trim())
      errors.tipoImovel = "Selecione o tipo do imóvel.";
    if (!String(v.nome || "").trim())
      errors.nome = "Informe o endereço do imóvel.";
    else if (String(v.nome).length > 255)
      errors.nome = "Use até 255 caracteres.";
    if (String(v.numero || "").length > 32)
      errors.numero = "Use até 32 caracteres.";
    if (v.cep && String(v.cep).replace(/\D/g, "").length !== 8)
      errors.cep = "Informe os 8 dígitos do CEP ou deixe em branco.";
    if (String(v.complemento || "").length > 255)
      errors.complemento = "Use até 255 caracteres.";
    if (![1, 2, 3, 4, 5].includes(Number(v.situacaoVisita)))
      errors.situacaoVisita = "Selecione a situação encontrada.";
    check("numeroQuartos", v.numeroQuartos);
  }
  if (page === "inspecao") {
    if (!v.__inspectionAnswered && !(v.itensInspecionados || []).length)
      errors.inspecao = "Informe se encontrou depósitos para inspecionar.";
    if (v.__inspectionHasDeposits && !(v.itensInspecionados || []).length)
      errors.inspecao =
        "Selecione ao menos um tipo de depósito ou escolha Não.";
    for (const id of v.itensInspecionados || []) {
      if (![1, 2, 3, 4, 5, 6, 7].includes(Number(id)))
        errors.inspecao = "Selecione um tipo de depósito válido.";
      check(`depositos.${id}`, v.depositosInspecionados?.[id], true);
    }
  }
  if (page === "amostra") {
    Object.assign(errors,laboratoryErrors(v.boletim));
    if (!v.__sampleAnswered && !v.contemAmostra)
      errors.amostra = "Informe se houve coleta de amostras.";
    if (v.contemAmostra) {
      for (const key of ["numeroInicio", "numeroFinal", "quantidade"])
        check(`amostra.${key}`, v.amostra?.[key], true);
      if (
        !errors["amostra.numeroFinal"] &&
        Number(v.amostra?.numeroFinal) < Number(v.amostra?.numeroInicio)
      )
        errors["amostra.numeroFinal"] =
          "O número final deve ser maior ou igual ao inicial.";
      const images = v.amostra?.imagens || [];
      if (
        images.length > 2 ||
        images.some(
          (img: any) =>
            typeof img !== "string" ||
            !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(img) ||
            img.length > 120000,
        )
      )
        errors.fotos = "Use até duas fotos JPEG de 90 KB cada.";
    }
  }
  if (page === "tratamento") {
    if (!v.__treatmentAnswered && !v.contemTratamento)
      errors.tratamento = "Informe se foi realizado tratamento.";
    if (v.contemTratamento) {
      if (v.boletim?.focalGramas != null && v.boletim.focalGramas !== "") {
        const grams = Number(String(v.boletim.focalGramas).replace(",", "."));
        if (!Number.isFinite(grams) || grams < 0 || grams > 1000000)
          errors["boletim.focalGramas"] = "Informe gramas entre 0 e 1000000.";
      }
      const second = v.boletim?.focal2 || {};
      if (Object.values(second).some((value) => String(value ?? "").trim())) {
        if (!String(second.tipo || "").trim())
          errors["boletim.focal2.tipo"] = "Informe o segundo larvicida.";
        const grams = Number(String(second.gramas ?? "").replace(",", "."));
        if (
          second.gramas == null ||
          second.gramas === "" ||
          !Number.isFinite(grams) ||
          grams < 0 ||
          grams > 1000000
        )
          errors["boletim.focal2.gramas"] =
            "Informe a quantidade em gramas entre 0 e 1000000.";
        check("boletim.focal2.depositos", second.depositos, true);
      }
      const t = v.tratamento || {};
      for (const key of [
        "depositosEliminados",
        "imoveisTratados",
        "quantidadeTratamento",
        "quantidadeCarga",
      ])
        check(`tratamento.${key}`, t[key]);
      for (const mode of ["focal", "perifocal"])
        if (t[mode]?.ativo) {
          if (!String(t[mode].tipo || "").trim())
            errors[`tratamento.${mode}.tipo`] = "Informe o produto utilizado.";
          for (const key of ["quantidadeCarga", "quantidadeTratamento"])
            check(`tratamento.${mode}.${key}`, t[mode][key], true);
        }
      // O boletim PNCD exige os gramas do larvicida L1 quando o focal está
      // ativo ou quando há um tratamento legado com produto informado.
      if (
        (t.focal?.ativo || String(t.tipo || "").trim()) &&
        !String(v.boletim?.focalGramas ?? "").trim()
      )
        errors["boletim.focalGramas"] =
          "Informe as gramas de larvicida L1 aplicadas.";
    }
  }
  if (page === "revisao") {
    for (const key of ["primeiraVisita", "segundaVisita"])
      if (
        v[key] &&
        !Number.isFinite(
          new Date(
            typeof v[key] === "string" ? v[key].replace(" ", "T") : v[key],
          ).getTime(),
        )
      )
        errors[key] = "Informe uma data válida.";
    if (!["N", "R"].includes(v.tipoVisita || "N"))
      errors.tipoVisita = "Selecione visita normal ou retorno.";
  }
  return errors;
}
export function accessibleVisitPage(
  target: VisitPage,
  visit: Record<string, any>,
): VisitPage {
  const stages = visitStages(visit.situacaoVisita),
    targetIndex = stages.findIndex((s) => s.page === target);
  if (targetIndex < 0) return "index";
  for (const stage of stages.slice(0, targetIndex))
    if (
      !(visit.__completed || []).includes(stage.page) ||
      Object.keys(visitPageErrors(stage.page, visit)).length
    )
      return stage.page;
  return target;
}
export function nextVisitPage(page: VisitPage, status: unknown): VisitPage {
  const stages = visitStages(status),
    index = stages.findIndex((s) => s.page === page);
  return stages[index + 1]?.page || "revisao";
}
export function changedVisitStage(
  patch: Record<string, any>,
): VisitPage | null {
  const keys = Object.keys(patch);
  if (keys.includes("boletim")) return "index";
  if (
    keys.some((k) =>
      [
        "nome",
        "numero",
        "cep",
        "complemento",
        "lado",
        "tipoImovel",
        "numeroQuartos",
        "situacaoVisita",
      ].includes(k),
    )
  )
    return "index";
  if (
    keys.some((k) =>
      [
        "itensInspecionados",
        "depositosInspecionados",
        "__inspectionAnswered",
        "__inspectionHasDeposits",
      ].includes(k),
    )
  )
    return "inspecao";
  if (
    keys.some((k) =>
      ["amostra", "contemAmostra", "__sampleAnswered"].includes(k),
    )
  )
    return "amostra";
  if (
    keys.some((k) =>
      ["tratamento", "contemTratamento", "__treatmentAnswered"].includes(k),
    )
  )
    return "tratamento";
  return null;
}
