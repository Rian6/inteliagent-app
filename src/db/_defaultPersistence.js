import * as SQLite from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";
import { DATABASE_NAME } from "@root/constants/database";
import {
  confirmLoads,
  getLoads,
  uploadLoads,
} from "@root/service/carga/loadService";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const persist = async (sqlInsert, params, tableName, sync = true) => {
  try {
    await db.runSync(sqlInsert, params);

    const novoId = await db.getFirstAsync(
      `SELECT ID FROM ${tableName} ORDER BY rowid DESC LIMIT 1`,
      []
    );

    const idSincronizacao = await db.getFirstAsync(
      `SELECT ID FROM TABLES_SINCRONYZE WHERE TABELA = '${tableName}' AND (ID_REGISTRO = '${novoId.ID}' OR ID_REGISTRO = '' )`,
      []
    );

    if (!idSincronizacao || !idSincronizacao.ID) {
      await db.runAsync(
        "INSERT INTO TABLES_SINCRONYZE (TABELA, ID_REGISTRO) VALUES (?, ?)",
        [tableName, novoId.ID]
      );
    }
    
    if (sync) {
      await syncIfConnected();
    }
    return novoId.ID;
  } catch (error) {
    console.error(error);
  }
};

const isInternetAvailable = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

const syncIfConnected = async () => {
  const hasInternet = await isInternetAvailable();
  if (hasInternet) {
    const tables = await db.getAllSync(
      "SELECT ID_REGISTRO, TABELA FROM TABLES_SINCRONYZE",
      []
    );
    const insertTables = [];

    if (!tables || tables.length == 0) {
      return;
    }

    for (const row of tables) {
      const table = { id: row.ID_REGISTRO, tabela: row.TABELA };
      const columns = await db.getAllSync(
        `PRAGMA table_info('${table.tabela}')`,
        []
      );
      if (!columns.length) {
        console.error(`Tabela ${table.tabela} não encontrada ou sem colunas.`);
        continue;
      }

      const register = await db.getFirstSync(
        `SELECT * FROM '${table.tabela}' WHERE ID = '${table.id}';`,
        []
      );
      if (!register) {
        console.error(
          `Registro com ID ${table.id} não encontrado na tabela ${table.tabela}.`
        );
        continue;
      }

      const columnNames = columns.map((col) => col.name).join(", ");

      const values = columns
        .map((col) => {
          const value = register[col.name];
          return value === null ||
            value === undefined ||
            (value === "" && col.name != "ID")
            ? "NULL"
            : `'${String(value).replace(/'/g, "''")}'`;
        })
        .join(", ");

      const sql = `REPLACE INTO ${table.tabela} (${columnNames}) VALUES (${values})`;
      insertTables.push({ id: table.id, sql, tabela: table.tabela });
    }

    if (insertTables.length > 0) {
      try {
        const response = await uploadLoads(insertTables);
        const result = response.data;

        if (result.confirmedIds && Array.isArray(result.confirmedIds)) {
          const idsToDelete = result.confirmedIds
            .map((id) => `'${id}'`)
            .join(",");
          await db.runAsync(
            `DELETE FROM TABLES_SINCRONYZE WHERE ID_REGISTRO IN (${idsToDelete})`
          );
          consumer();
        }
      } catch (error) {
        console.error("Erro ao sincronizar registros:", error);
      }
    }
  }
};

export async function consumer(isLoadFull = false) {
  const usuario = await db.getFirstSync(`SELECT ID FROM USUARIO`, []);
  const loads = await getLoads(usuario.ID, isLoadFull);

  if (loads.data) {
    const dataHoraInicioProcesso = loads.data.dataHoraInicioProcesso;
    const consumerLoadsList = loads.data.consumerLoadsList;

    const tables = await Promise.all(
      consumerLoadsList.map(async (data) => {
        try {
          const sql = `REPLACE INTO ${data.tableName} ${data.cabecalho} VALUES ${data.data}`;
          await db.runAsync(sql);
          return data.tableName; // Retorna o nome da tabela
        } catch (e) {
          console.error(e);
          return null; // Retorna nulo em caso de erro
        }
      })
    );

    confirmLoads(usuario.ID, dataHoraInicioProcesso, tables);
  }
}
