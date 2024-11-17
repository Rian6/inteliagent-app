import { DATABASE_NAME } from "@root/constants/database";
import { persist } from "@root/db/_defaultPersistence";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export async function inserirVisita(visita){
    try {
        const tableName = 'VISITA';
        const sqlInsert = `
            INSERT INTO PLANEJAMENTO 
            (ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO) 
            VALUES ($ID_CIDADE, $ID_CATEGORIA, $NOME, $ATIVIDADE, $TIPO, $DATA_ULT_VISITA, $ANO, $ZONA, $STATUS, $SITUACAO);
        `;
        const newVisita = {
            $ID_ENDERECO: 0,
            $ID_PLANEJAMENTO: visita.idPlanejamento,
            $PRIMEIRA_VISITA: visita.primeiraVisita.toISOString().replace('T', ' ').slice(0, -1),
            $SEGUNDA_VISITA: visita.segundaVisita.toISOString().replace('T', ' ').slice(0, -1),
            $TIPO_VISITA: visita.tipoVisita,
            $NUMERO_QUARTOS: visita.numeroQuartos,
            $CONTEM_AMOSTRA: visita.contemAmostra,
            $CONTEM_TRATAMENTO: visita.contemTratamento,
            $SITUACAO_REFERENCIA: visita.situacaoReferencia,
            $SITUACAO: 1
        };

        const idVisita = await persist(sqlInsert, newVisita, tableName, false);
        await inserirInspecoes(visita.inspecoes, idVisita)
        await inserirAmostras(visita.amostras, idVisita)

        return newId;
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};

async function inserirInspecoes(inspecoes, idVisita){
    const tableName = 'INSPECAO';
    const sqlInsert = `
        INSERT INTO PLANEJAMENTO 
        (ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO) 
        VALUES ($ID_CIDADE, $ID_CATEGORIA, $NOME, $ATIVIDADE, $TIPO, $DATA_ULT_VISITA, $ANO, $ZONA, $STATUS, $SITUACAO);
    `;

    const newInspecoes = inspecoes.map((inspecao) => {
      return {
        $ID_VISITA: idVisita,
        $TIPO: inspecao.tipo,
        $NUMERO_DEPOSITOS: inspecao.numeroDepositos,
        $SITUACAO: 1,
      };
    });

    for (const newInspecao of newInspecoes) {
        await persist(sqlInsert, newInspecao, tableName, false);
    }
}

async function inserirAmostras(amostras, idVisita){
    const tableName = 'AMOSTRA';
    const sqlInsert = `
        INSERT INTO PLANEJAMENTO 
        (ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO) 
        VALUES ($ID_CIDADE, $ID_CATEGORIA, $NOME, $ATIVIDADE, $TIPO, $DATA_ULT_VISITA, $ANO, $ZONA, $STATUS, $SITUACAO);
    `;

    const newAmostras = amostras.map((amostra) => {
      return {
        $ID_VISITA: idVisita,
        $TIPO: inspecao.tipo,
        $NUMERO_DEPOSITOS: inspecao.numeroDepositos,
        $SITUACAO: 1,
      };
    });

    for (const newAmostra of newAmostras) {
        await persist(sqlInsert, newAmostra, tableName, false);
    }
}

export async function getVisitas(){
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
