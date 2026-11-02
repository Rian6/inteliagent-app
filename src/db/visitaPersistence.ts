import { database as db } from '@root/offline/database';
import { currentEngine,scheduleSync } from '@root/offline/runtime';
import { Visits } from '@root/offline/visits.ts';
export async function inserirVisita(visit) {
  const id=await new Visits(currentEngine()).save(visit);
  scheduleSync();
  return id;
}
export async function findLastVisitas() {
    try {
        const visitas = await db.getAllAsync(
            `SELECT 
                v.ID,
                v.NOME,
                v.NUMERO
            FROM VISITA v
            WHERE COALESCE(v.SITUACAO,1) <> 0 ORDER BY v.ID DESC LIMIT 10`,
        );

        return visitas.map(visita => {
            return {
                id: visita.ID,
                title: visita.NOME,
                numero: visita.NUMERO
            }
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
            WHERE COALESCE(v.SITUACAO,1) <> 0 GROUP BY ZONA`,
        );

        return {
            labels: visitas.map(visita => visita.ZONA),
            data: visitas.map(visita => visita.DATA)
        }
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }
}

export async function findAmostraByIdVisita(idVisita) {
    try {
        const amostra = await db.getFirstAsync(
            `SELECT 
                ID_VISITA, 
                NUMERO_INICIO, 
                NUMERO_FINAL, 
                QUANTIDADE
            FROM AMOSTRA
            WHERE ID_VISITA = $ID`,
            { $ID: idVisita }
        );
        if (amostra) {
            return {
                numeroInicio: amostra.NUMERO_INICIO,
                numeroFinal: amostra.NUMERO_FINAL,
                quantidade: amostra.QUANTIDADE
            };
        }
        return null;
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

        if (!visita) return null;

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
        const visitas = await db.getAllAsync(
            `SELECT ID, NOME, NUMERO, SITUACAO_REFERENCIA, COALESCE(SITUACAO, 2) AS STATUS, LATITUDE, LONGITUDE, SEQUENCIA FROM VISITA WHERE COALESCE(SITUACAO,1) <> 0 AND ID_PLANEJAMENTO = $ID order by sequencia`,
            { $ID: idAtendimento }
        );

        if (visitas) {
            return visitas.map(visita => {
                return { id: visita.ID, sequencia: visita.SEQUENCIA, status: visita.SITUACAO_REFERENCIA, latitude: visita.LATITUDE, longitude: visita.LONGITUDE, title: (visita.NOME + ", " + visita.NUMERO), nome: (visita.NOME + ", " + visita.NUMERO) };
            });
        }
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }

    return [];
}

export async function buscarInspecoes(idvisita) {
    try {
        const inspecoes = await db.getAllAsync(
            `select TIPO from inspecao i WHERE i.id_visita = $ID AND COALESCE(i.SITUACAO,1)<>0`,
            { $ID: idvisita }
        );

        if (inspecoes) {
            return inspecoes.map(inspecao => {
                return inspecao.TIPO;
            });
        }
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }

    return [];
}

export async function buscarPesquisarVisitas(idAtendimento, query) {
    try {
        const visitas = await db.getAllAsync(
            `SELECT ID, NOME, NUMERO, SITUACAO_REFERENCIA, COALESCE(SITUACAO, 2) AS STATUS, LATITUDE, LONGITUDE, SEQUENCIA FROM VISITA WHERE COALESCE(SITUACAO,1) <> 0 AND ID_PLANEJAMENTO = $ID AND (NOME LIKE $QUERY OR NUMERO LIKE $QUERY) order by sequencia`,
            { $ID: idAtendimento, $QUERY: `%${query}%` }
        );

        if (visitas) {
            return visitas.map(visita => {
                return { id: visita.ID, sequencia: visita.SEQUENCIA, status: visita.SITUACAO_REFERENCIA, latitude: visita.LATITUDE, longitude: visita.LONGITUDE, title: (visita.NOME + ", " + visita.NUMERO), nome: (visita.NOME + ", " + visita.NUMERO) };
            });
        }
    } catch (error) {
        console.error("Erro na consulta ao banco de dados:", error);
    }

    return [];
}
