import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { DATABASE_NAME } from '@root/constants/database';
import { uploadLoads } from '@root/service/carga/loadService';

const db = SQLite.openDatabaseSync(DATABASE_NAME);

// Função para verificar a conexão com a Internet
const isInternetAvailable = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected;
};

// Função de inserção genérica
export const insertIntoTable = async (sqlInsert, params, tableName) => {

    const registro = await db.runAsync(sqlInsert, params);
    await db.runAsync(sqlInsert, 'INSERT INTO TABLES_SINCRONYZE (TABELA, ID_REGISTRO) VALUES (?, ?)', [tableName, registro.lastInsertRowId]);
    await syncIfConnected()
};

const syncIfConnected = async () => {
    const hasInternet = await isInternetAvailable();
    if (hasInternet) {
        


        db.transaction(tx => {
            tx.executeSql('SELECT * FROM TABLES_SINCRONYZE', [], async (_, { rows }) => {
                const pendingRecords = rows._array; // Registros pendentes

                if (pendingRecords.length > 0) {
                    // Prepare os dados para enviar ao endpoint
                    const syncData = pendingRecords.map(record => ({
                        tabela: record.TABELA,
                        id_registro: record.ID_REGISTRO
                    }));

                    // Chame o seu endpoint aqui (exemplo usando fetch)
                    try {
                        const response = await uploadLoads(syncData);
                        const result = await response.json();

                        if (result.confirmedIds && Array.isArray(result.confirmedIds)) {
                            const idsToDelete = result.confirmedIds.join(',');
                            tx.executeSql(`DELETE FROM TABLES_SINCRONYZE WHERE ID_REGISTRO IN (${idsToDelete})`);
                        }
                    } catch (error) {
                        console.error('Erro ao sincronizar registros:', error);
                    }
                }
            });
        });
    }
};
