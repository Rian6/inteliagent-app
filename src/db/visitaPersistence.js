import { DATABASE_NAME } from "@root/constants/database";
import { persist } from "@root/db/_defaultPersistence";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export async function inserirVisita(visita){
    try {

        const tableName = 'VISITA';
        const sqlInsert = `
            REPLACE INTO VISITA 
            (ID, ID_ENDERECO, ID_PLANEJAMENTO, PRIMEIRA_VISITA, SEGUNDA_VISITA, TIPO_VISITA, NUMERO_QUARTOS, CONTEM_AMOSTRA, CONTEM_TRATAMENTO, SITUACAO_REFERENCIA, SITUACAO) 
            VALUES ($ID, $ID_ENDERECO, $ID_PLANEJAMENTO, $PRIMEIRA_VISITA, $SEGUNDA_VISITA, $TIPO_VISITA, $NUMERO_QUARTOS, $CONTEM_AMOSTRA, $CONTEM_TRATAMENTO, $SITUACAO_REFERENCIA, $SITUACAO);
        `;
        const newVisita = {
            $ID: visita.id,
            $ID_ENDERECO: 0,
            $ID_PLANEJAMENTO: visita.idPlanejamento,
            $PRIMEIRA_VISITA: visita.primeiraVisita ? visita.primeiraVisita.toISOString().replace('T', ' ').slice(0, -1): '',
            $SEGUNDA_VISITA: visita.segundaVisita ? visita.segundaVisita.toISOString().replace('T', ' ').slice(0, -1): '',
            $TIPO_VISITA: visita.tipoVisita,
            $NUMERO_QUARTOS: visita.numeroQuartos,
            $CONTEM_AMOSTRA: visita.contemAmostra,
            $CONTEM_TRATAMENTO: visita.contemTratamento,
            $SITUACAO_REFERENCIA: visita.situacaoReferencia,
            $SITUACAO: 1
        };

        const idVisita = await persist(sqlInsert, newVisita, tableName, false);
        console.log("----------------------------------------------------------------------------------");

        await inserirInspecoes(visita.inspecoes, idVisita)
        await inserirAmostras(visita.amostra, idVisita)
        await inserirTratamento(visita.tratamento, idVisita)

        return newId;
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};

async function inserirTratamento(tratamento, idVisita){
    const tableName = 'TRATAMENTO';
    const sqlInsert = `
        INSERT INTO TRATAMENTO 
        (ID_VISITA, DEPOSITOS_ELIMINADOS, IMOVEIS_TRATADOS, QTD_TRATAMENTO, TIPO, QTD_CARGA, SITUACAO) 
        VALUES ($ID_VISITA, $DEPOSITOS_ELIMINADOS, $IMOVEIS_TRATADOS, $QTD_TRATAMENTO, $TIPO, $QTD_CARGA, $SITUACAO);
    `;

    const newTratamento = {
        $ID_VISITA: idVisita,
        $DEPOSITOS_ELIMINADOS: tratamento.depositosEliminados,
        $IMOVEIS_TRATADOS : tratamento.imoveisTratados,
        $QTD_TRATAMENTO: tratamento.quantidadeTratamento,
        $TIPO: tratamento.tipo,
        $QTD_CARGA: tratamento.quantidadeCarga,
        $SITUACAO: 1
      };

    await persist(sqlInsert, newTratamento, tableName, true);
}

async function inserirInspecoes(inspecoes, idVisita){
    const tableName = 'INSPECAO';
    const sqlInsert = `
        INSERT INTO INSPECAO 
        (ID_VISITA, TIPO, NUMERO_DEPOSITOS, SITUACAO) 
        VALUES ($ID_VISITA, $TIPO, $NUMERO_DEPOSITOS, $SITUACAO);
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

async function inserirAmostras(amostra, idVisita){
    const tableName = 'AMOSTRA';
    const sqlInsert = `
        INSERT INTO AMOSTRA 
        (ID_VISITA, NUMERO_INICIO, NUMERO_FINAL, QUANTIDADE, SITUACAO) 
        VALUES ($ID_VISITA, $NUMERO_INICIO, $NUMERO_FINAL, $QUANTIDADE, $SITUACAO);
    `;

    const newAmostra = {
        $ID_VISITA: idVisita,
        $NUMERO_INICIO: amostra.numeroInicio,
        $NUMERO_FINAL: amostra.numeroFinal,
        $QUANTIDADE: amostra.quantidade,
        $SITUACAO: 1
    }

    const idAmostra = await persist(sqlInsert, newAmostra, tableName, false);

    const tableNameImagem = 'IMAGEM_AMOSTRA';
    const sqlInsertImagem = `
        INSERT INTO IMAGEM_AMOSTRA 
        (ID_AMOSTRA, NOME, IMAGEM, SITUACAO) 
        VALUES ($ID_AMOSTRA, $NOME, $IMAGEM, $SITUACAO);
    `;

    const newAmostraImagens = amostra.imagens.map((imagem) => {
      return {
        $ID_AMOSTRA: idAmostra,
        $NOME: imagem.nome,
        $IMAGEM: imagem.conteudo,
        $SITUACAO: 1
      };
    });

    for (const newImagem of newAmostraImagens) {
        await persist(sqlInsertImagem, newImagem, tableNameImagem, false);
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
