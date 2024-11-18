import { DATABASE_NAME } from "@root/constants/database";
import { persist } from "@root/db/_defaultPersistence";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export async function inserirPlanejamento(itemData){
    const tableName = 'PLANEJAMENTO';
    const sqlInsert = `
        REPLACE INTO PLANEJAMENTO 
        (${itemData.id ? 'ID,' : ''} ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO) 
        VALUES (${itemData.id ? '$ID,' : ''} $ID_CIDADE, $ID_CATEGORIA, $NOME, $ATIVIDADE, $TIPO, $DATA_ULT_VISITA, $ANO, $ZONA, $STATUS, $SITUACAO);
    `;
    const params = {
        $ID: itemData.id,
        $ID_CIDADE: itemData.idCidade,
        $ID_CATEGORIA: itemData.idCategoria,
        $NOME: itemData.nome,
        $ATIVIDADE: itemData.atividade,
        $TIPO: itemData.tipo,
        $DATA_ULT_VISITA: itemData.dataUltVisita.toISOString().replace('T', ' ').slice(0, -1),
        $ANO: new Date().toISOString().replace('T', ' ').slice(0, -1),
        $ZONA: itemData.zona,
        $STATUS: itemData.status,
        $SITUACAO: itemData.situacao
    };

    try {
        const newId = await persist(sqlInsert, params, tableName);
        console.log('Item inserido com ID:', newId);
        return newId;
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};

export async function getPlanejamentos(){
    const planejamentos = await db.getAllSync(`SELECT ID, NOME, DATA_ULT_VISITA, STATUS FROM PLANEJAMENTO`, []);

    try {
        if(planejamentos){
            return await planejamentos.map(pl =>{
                return {id: pl.ID, nome: pl.NOME, data: pl.DATA_ULT_VISITA, status: pl.STATUS}
            })
        }
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};

export async function getPlanejamentoById(id){
    const pl = await db.getFirstAsync(`SELECT ID, ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO FROM PLANEJAMENTO WHERE ID = $ID`, {$ID: id});

    try {
        const planejamento = {
            id: pl.ID,
            idCidade: pl.ID_CIDADE,
            idCategoria: pl.ID_CATEGORIA,
            nome: pl.NOME,
            atividade: pl.ATIVIDADE,
            tipo: pl.TIPO,
            dataUltVisita: pl.DATA_ULT_VISITA,
            ano: pl.ANO,
            zona: pl.ZONA,
            status: pl.STATUS,
            situacao: pl.SITUACAO
        }
        return planejamento;
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};
