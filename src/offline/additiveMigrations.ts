/** Recover only fully applied, known additive upgrades; never infer or rewrite data. */
export async function recordAppliedAdditiveMigrations(db, journal) {
  const checks = [
    {
      index: 1,
      tables: { VISITA: ["LADO", "TIPO_IMOVEL"], AMOSTRA: ["IMAGENS_JSON"] },
    },
    { index: 2, tables: { PLANEJAMENTO: ["CICLO", "CATALOGO_VERSAO"] } },
    {
      index: 3,
      tables: { PLANEJAMENTO: ["BOLETIM_JSON"], VISITA: ["BOLETIM_JSON"] },
    },
  ];
  for (const check of checks) {
    const entry = journal.entries[check.index];
    if (!entry) continue;
    let complete = true;
    for (const [table, required] of Object.entries(check.tables)) {
      const columns = await db.getAllAsync(`PRAGMA table_info(${table})`);
      if (
        !required.every((name) =>
          columns.some((column) => column.name.toUpperCase() === name),
        )
      )
        complete = false;
    }
    if (!complete) break;
    await db.runAsync(
      "INSERT INTO __drizzle_migrations (hash,created_at) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE created_at=?)",
      ["verified-additive-" + check.index, entry.when, entry.when],
    );
  }
}
