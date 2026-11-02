import { sql } from 'drizzle-orm';
import { blob, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// These declarations are the source for generated SQLite migrations and typed queries.
const uuidDefault = sql.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))");
const uuid = () => text('ID').primaryKey().default(uuidDefault);

export const usuario = sqliteTable('USUARIO', {
  id: integer('ID').primaryKey(), nome: text('NOME'), email: text('EMAIL'),
  idCede: integer('ID_CEDE'), idImagemPerfilUsuario: integer('ID_IMAGEM_PERFIL_USUARIO'), situacao: integer('SITUACAO'),
});
export const planejamento = sqliteTable('PLANEJAMENTO', {
  id: uuid(), idCidade: integer('ID_CIDADE'), idCategoria: integer('ID_CATEGORIA'),
  nome: text('NOME'), atividade: integer('ATIVIDADE'), tipo: integer('TIPO'),
  dataUltVisita: text('DATA_ULT_VISITA'), ano: text('ANO'), zona: text('ZONA'),
  status: integer('STATUS'), situacao: integer('SITUACAO'),
  boletimJson: text('BOLETIM_JSON'), ciclo: integer('CICLO'), catalogoVersao: text('CATALOGO_VERSAO'),
});
export const cidade = sqliteTable('CIDADE', {id: uuid(), nome: text('NOME'), situacao: integer('SITUACAO')});
export const categoria = sqliteTable('CATEGORIA', {id: uuid(), nome: text('NOME'), situacao: integer('SITUACAO')});
export const endereco = sqliteTable('ENDERECO', {
  id: uuid(), nome: text('NOME'), idCidade: integer('ID_CIDADE'), cep: text('CEP'), numero: text('NUMERO'),
  lado: text('LADO'), tipoImovel: text('TIPO_IMOVEL'), complemento: text('COMPLEMENTO'), situacao: integer('SITUACAO'),
});
export const visita = sqliteTable('VISITA', {
  id: uuid(), idPlanejamento: text('ID_PLANEJAMENTO'), primeiraVisita: text('PRIMEIRA_VISITA'),
  segundaVisita: text('SEGUNDA_VISITA'), tipoVisita: text('TIPO_VISITA'), numeroQuartos: text('NUMERO_QUARTOS'),
  contemAmostra: integer('CONTEM_AMOSTRA', {mode:'boolean'}), contemTratamento: integer('CONTEM_TRATAMENTO', {mode:'boolean'}),
  sequencia: integer('SEQUENCIA'), latitude: real('LATITUDE'), longitude: real('LONGITUDE'),
  boletimJson: text('BOLETIM_JSON'), situacaoReferencia: integer('SITUACAO_REFERENCIA'), situacao: integer('SITUACAO'),
  cep: text('CEP'), nome: text('NOME'), numero: text('NUMERO'), complemento: text('COMPLEMENTO'),
  lado: text('LADO'), tipoImovel: text('TIPO_IMOVEL'),
}, table => [index('IDX_VISITA_PLAN').on(table.idPlanejamento,table.sequencia)]);
export const inspecao = sqliteTable('INSPECAO', {
  id: uuid(), idVisita: text('ID_VISITA'), tipo: integer('TIPO'), numeroDepositos: integer('NUMERO_DEPOSITOS'), situacao: integer('SITUACAO'),
}, table => [index('IDX_INSPECAO_VISITA').on(table.idVisita)]);
export const amostra = sqliteTable('AMOSTRA', {
  id: uuid(), idVisita: text('ID_VISITA'), numeroInicio: integer('NUMERO_INICIO'),
  numeroFinal: integer('NUMERO_FINAL'), quantidade: integer('QUANTIDADE'), situacao: integer('SITUACAO'),
  imagensJson: text('IMAGENS_JSON'),
}, table => [index('IDX_AMOSTRA_VISITA').on(table.idVisita)]);
export const imagemAmostra = sqliteTable('IMAGEM_AMOSTRA', {
  id: uuid(), idAmostra: text('ID_AMOSTRA'), nome: text('NOME'), imagem: blob('IMAGEM'), situacao: integer('SITUACAO'),
});
export const tratamento = sqliteTable('TRATAMENTO', {
  id: uuid(), idVisita: text('ID_VISITA'), depositosEliminados: integer('DEPOSITOS_ELIMINADOS'),
  imoveisTratados: integer('IMOVEIS_TRATADOS'), qtdTratamento: integer('QTD_TRATAMENTO'),
  tipo: text('TIPO'), qtdCarga: integer('QTD_CARGA'), situacao: integer('SITUACAO'),
}, table => [index('IDX_TRATAMENTO_VISITA').on(table.idVisita)]);
export const legacySync = sqliteTable('TABLES_SINCRONYZE', {
  id: integer('ID').primaryKey(), tabela: text('TABELA'), idRegistro: text('ID_REGISTRO'),
});
export const syncMeta = sqliteTable('SYNC_META', {
  key: text('KEY').primaryKey(), value: text('VALUE').notNull(),
});
export const visitDrafts = sqliteTable('VISITA_DRAFTS', {
  id: text('ID').primaryKey(), planId: text('PLAN_ID'), payloadJson: text('PAYLOAD_JSON').notNull(), updatedAt: integer('UPDATED_AT').notNull(),
});
export const syncEntities = sqliteTable('SYNC_ENTITIES', {
  tableName: text('TABLE_NAME').notNull(), entityId: text('ENTITY_ID').notNull(),
  serverVersion: integer('SERVER_VERSION').notNull(), snapshotJson: text('SNAPSHOT_JSON').notNull(),
}, table => [primaryKey({columns:[table.tableName,table.entityId]})]);
export const syncOutbox = sqliteTable('SYNC_OUTBOX', {
  sequence: integer('SEQUENCE').primaryKey({autoIncrement:true}), mutationId: text('MUTATION_ID').notNull().unique(),
  groupId: text('GROUP_ID').notNull(), aggregateKey: text('AGGREGATE_KEY').notNull(),
  tableName: text('TABLE_NAME').notNull(), entityId: text('ENTITY_ID').notNull(), payloadJson: text('PAYLOAD_JSON').notNull(),
  baseVersion: integer('BASE_VERSION'), dependsOn: text('DEPENDS_ON'), state: text('STATE').notNull().default('pending'),
  attempts: integer('ATTEMPTS').notNull().default(0), nextAttemptAt: integer('NEXT_ATTEMPT_AT').notNull().default(0),
  error: text('ERROR'), serverJson: text('SERVER_JSON'), serverVersion: integer('SERVER_VERSION'), createdAt: integer('CREATED_AT').notNull(),
}, table => [
  index('IDX_OUTBOX_READY').on(table.state,table.nextAttemptAt,table.sequence),
  index('IDX_OUTBOX_ENTITY').on(table.tableName,table.entityId,table.sequence),
  index('IDX_OUTBOX_DEPENDS').on(table.dependsOn),
  index('IDX_OUTBOX_GROUP').on(table.groupId),
  index('IDX_OUTBOX_AGGREGATE').on(table.aggregateKey),
]);

export type VisitEntity = typeof visita.$inferSelect;
export type VisitDraftEntity = typeof visitDrafts.$inferSelect;
export type OutboxEntity = typeof syncOutbox.$inferSelect;
export type PlanningEntity = typeof planejamento.$inferSelect;
