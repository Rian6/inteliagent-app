import { DATABASE_NAME } from "@root/constants/database";
import { persist } from "@root/db/_defaultPersistence";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export async function inserirVisita(visita){
    try {
        const tableName = 'VISITA';
        const sqlInsert = `
            REPLACE INTO VISITA
                (${visita.id ? 'ID,' : ''} ID_PLANEJAMENTO, PRIMEIRA_VISITA, SEGUNDA_VISITA,
                TIPO_VISITA, NUMERO_QUARTOS, CONTEM_AMOSTRA, CONTEM_TRATAMENTO, SITUACAO_REFERENCIA,
                CEP, NOME, NUMERO, COMPLEMENTO, SITUACAO)
            VALUES 
                (${visita.id ? '$ID,' : ''} $ID_PLANEJAMENTO, $PRIMEIRA_VISITA, $SEGUNDA_VISITA,
                $TIPO_VISITA, $NUMERO_QUARTOS, $CONTEM_AMOSTRA, $CONTEM_TRATAMENTO, $SITUACAO_REFERENCIA,
                $CEP, $NOME, $NUMERO, $COMPLEMENTO, $SITUACAO);
        `;
        let newVisita = {
            $ID_PLANEJAMENTO: visita.idPlanejamento,
            $PRIMEIRA_VISITA: visita.primeiraVisita ? visita.primeiraVisita : new Date(),
            $SEGUNDA_VISITA: visita.segundaVisita ? visita.segundaVisita : new Date(),
            $TIPO_VISITA: visita.tipoVisita,
            $NUMERO_QUARTOS: visita.numeroQuartos,
            $CONTEM_AMOSTRA: visita.contemAmostra,
            $CONTEM_TRATAMENTO: visita.contemTratamento,
            $SITUACAO_REFERENCIA: visita.situacaoVisita,
            $CEP: visita.cep,
            $NOME: visita.nome,
            $NUMERO: visita.numero,
            $COMPLEMENTO: visita.complemento,
            $SITUACAO: 1
        };    
        
        if(visita.id){
            newVisita.$ID = visita.id;
        }

        const idVisita = await persist(sqlInsert, newVisita, tableName, true);

        await inserirInspecoes(visita.inspecoes, idVisita)
        await inserirAmostras(visita.amostra, idVisita)
        await inserirTratamento(visita.tratamento, idVisita)

        return idVisita;
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
        await persist(sqlInsert, newInspecao, tableName, true);
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

    const idAmostra = await persist(sqlInsert, newAmostra, tableName, true);

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
        await persist(sqlInsertImagem, newImagem, tableNameImagem, true);
    }
}

export async function findLastVisitas() {
    try {
        const visitas = await db.getAllAsync(
            `SELECT 
                v.ID,
                v.NOME,
                v.NUMERO
            FROM VISITA v
            ORDER BY v.ID DESC LIMIT 10`,
        );

        return visitas.map(visita => {
            return {id: visita.ID,
            title: visita.NOME,
            numero: visita.NUMERO}
        });
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }
}

export async function countByRegiao() {
    try {
        const visitas = await db.getAllAsync(
            `SELECT 
                p.ZONA,
                COUNT(1) as DATA
            FROM VISITA v
            INNER JOIN PLANEJAMENTO P ON P.ID = V.ID_PLANEJAMENTO
            GROUP BY ZONA`,
        );

        return {labels: visitas.map(visita => visita.ZONA),
                data: visitas.map(visita => visita.DATA)}
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }
}

export async function findVisitaById(idVisita) {
    try {
        const visita = await db.getFirstAsync(
            `SELECT 
                v.ID, 
                v.PRIMEIRA_VISITA, 
                v.SEGUNDA_VISITA, 
                v.TIPO_VISITA, 
                v.NUMERO_QUARTOS,
                v.CONTEM_AMOSTRA, 
                v.CONTEM_TRATAMENTO, 
                v.SITUACAO_REFERENCIA, 
                v.SITUACAO, 
                v.ID_PLANEJAMENTO,
                v.CEP,
                v.NOME,
                v.NUMERO,
                v.COMPLEMENTO
            FROM VISITA v
            WHERE ID = $ID`,
            { $ID: idVisita }
        );

        return {
            id: visita.ID, 
            primeiraVisita: visita.PRIMEIRA_VISITA, 
            segundaVisita: visita.SEGUNDA_VISITA, 
            tipoVisita: visita.TIPO_VISITA, 
            numeroQuartos: visita.NUMERO_QUARTOS, 
            contemAmostra: visita.CONTEM_AMOSTRA, 
            contemTratamento: visita.CONTEM_TRATAMENTO, 
            situacaoVisita: visita.SITUACAO_REFERENCIA, 
            cep: visita.CEP,
            nome: visita.NOME,
            numero: visita.NUMERO,
            complemento: visita.COMPLEMENTO,
            situacao: visita.SITUACAO, 
            idPlanejamento: visita.ID_PLANEJAMENTO
        };
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }
}

export async function buscarVisitas(idAtendimento) {
    try {
        const visitas = await db.getAllSync(
            `SELECT ID, NOME, NUMERO, SITUACAO_REFERENCIA, COALESCE(SITUACAO, 2) AS STATUS, LATITUDE, LONGITUDE, SEQUENCIA FROM VISITA WHERE ID_PLANEJAMENTO = $ID order by sequencia`,
            { $ID: idAtendimento }
        );

        if (visitas) {
            return visitas.map(visita => {
                return { id: visita.ID, sequencia: visita.SEQUENCIA, status: visita.STATUS, latitude: visita.LATITUDE, longitude: visita.LONGITUDE, title: (visita.NOME + ", " + visita.NUMERO), nome: (visita.NOME + ", " + visita.NUMERO), status: visita.SITUACAO_REFERENCIA };
            });
        }
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }

    return [];
}
