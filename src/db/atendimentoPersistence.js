import { insertIntoTable } from "@root/db/_defaultPersistence";

export async function inserirPlanejamento(itemData){
    const sqlInsert = `
        INSERT INTO PLANEJAMENTO 
        (ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO) 
        VALUES ($ID_CIDADE, $ID_CATEGORIA, $NOME, $ATIVIDADE, $TIPO, $DATA_ULT_VISITA, $ANO, $ZONA, $STATUS, $SITUACAO);
    `;

    const params = {
        ID_CIDADE: itemData.idCidade,
        ID_CATEGORIA: itemData.idCategoria,
        NOME: itemData.nome,
        ATIVIDADE: itemData.atividade,
        TIPO: itemData.tipo,
        DATA_ULT_VISITA: itemData.dataUltVisita,
        ANO: itemData.ano,
        ZONA: itemData.zona,
        STATUS: itemData.status,
        SITUACAO: itemData.situacao
    };

    const tableName = 'PLANEJAMENTO';

    try {
        const newId = await insertIntoTable(sqlInsert, params, tableName);
        console.log('Item inserido com ID:', newId);
        return newId;
    } catch (error) {
        console.error('Erro ao inserir item:', error);
    }

    return null;
};
