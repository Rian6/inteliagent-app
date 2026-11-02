CREATE TABLE `AMOSTRA` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_VISITA` text,
	`NUMERO_INICIO` integer,
	`NUMERO_FINAL` integer,
	`QUANTIDADE` integer,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE INDEX `IDX_AMOSTRA_VISITA` ON `AMOSTRA` (`ID_VISITA`);--> statement-breakpoint
CREATE TABLE `CATEGORIA` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`NOME` text,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `CIDADE` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`NOME` text,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `ENDERECO` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`NOME` text,
	`ID_CIDADE` integer,
	`CEP` text,
	`NUMERO` text,
	`LADO` text,
	`TIPO_IMOVEL` text,
	`COMPLEMENTO` text,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `IMAGEM_AMOSTRA` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_AMOSTRA` text,
	`NOME` text,
	`IMAGEM` blob,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `INSPECAO` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_VISITA` text,
	`TIPO` integer,
	`NUMERO_DEPOSITOS` integer,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE INDEX `IDX_INSPECAO_VISITA` ON `INSPECAO` (`ID_VISITA`);--> statement-breakpoint
CREATE TABLE `TABLES_SINCRONYZE` (
	`ID` integer PRIMARY KEY NOT NULL,
	`TABELA` text,
	`ID_REGISTRO` text
);
--> statement-breakpoint
CREATE TABLE `PLANEJAMENTO` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_CIDADE` integer,
	`ID_CATEGORIA` integer,
	`NOME` text,
	`ATIVIDADE` integer,
	`TIPO` integer,
	`DATA_ULT_VISITA` text,
	`ANO` text,
	`ZONA` text,
	`STATUS` integer,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `SYNC_ENTITIES` (
	`TABLE_NAME` text NOT NULL,
	`ENTITY_ID` text NOT NULL,
	`SERVER_VERSION` integer NOT NULL,
	`SNAPSHOT_JSON` text NOT NULL,
	PRIMARY KEY(`TABLE_NAME`, `ENTITY_ID`)
);
--> statement-breakpoint
CREATE TABLE `SYNC_META` (
	`KEY` text PRIMARY KEY NOT NULL,
	`VALUE` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SYNC_OUTBOX` (
	`SEQUENCE` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`MUTATION_ID` text NOT NULL,
	`GROUP_ID` text NOT NULL,
	`AGGREGATE_KEY` text NOT NULL,
	`TABLE_NAME` text NOT NULL,
	`ENTITY_ID` text NOT NULL,
	`PAYLOAD_JSON` text NOT NULL,
	`BASE_VERSION` integer,
	`DEPENDS_ON` text,
	`STATE` text DEFAULT 'pending' NOT NULL,
	`ATTEMPTS` integer DEFAULT 0 NOT NULL,
	`NEXT_ATTEMPT_AT` integer DEFAULT 0 NOT NULL,
	`ERROR` text,
	`SERVER_JSON` text,
	`SERVER_VERSION` integer,
	`CREATED_AT` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SYNC_OUTBOX_MUTATION_ID_unique` ON `SYNC_OUTBOX` (`MUTATION_ID`);--> statement-breakpoint
CREATE INDEX `IDX_OUTBOX_READY` ON `SYNC_OUTBOX` (`STATE`,`NEXT_ATTEMPT_AT`,`SEQUENCE`);--> statement-breakpoint
CREATE INDEX `IDX_OUTBOX_ENTITY` ON `SYNC_OUTBOX` (`TABLE_NAME`,`ENTITY_ID`,`SEQUENCE`);--> statement-breakpoint
CREATE INDEX `IDX_OUTBOX_DEPENDS` ON `SYNC_OUTBOX` (`DEPENDS_ON`);--> statement-breakpoint
CREATE INDEX `IDX_OUTBOX_GROUP` ON `SYNC_OUTBOX` (`GROUP_ID`);--> statement-breakpoint
CREATE INDEX `IDX_OUTBOX_AGGREGATE` ON `SYNC_OUTBOX` (`AGGREGATE_KEY`);--> statement-breakpoint
CREATE TABLE `TRATAMENTO` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_VISITA` text,
	`DEPOSITOS_ELIMINADOS` integer,
	`IMOVEIS_TRATADOS` integer,
	`QTD_TRATAMENTO` integer,
	`TIPO` text,
	`QTD_CARGA` integer,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE INDEX `IDX_TRATAMENTO_VISITA` ON `TRATAMENTO` (`ID_VISITA`);--> statement-breakpoint
CREATE TABLE `USUARIO` (
	`ID` integer PRIMARY KEY NOT NULL,
	`NOME` text,
	`EMAIL` text,
	`ID_CEDE` integer,
	`ID_IMAGEM_PERFIL_USUARIO` integer,
	`SITUACAO` integer
);
--> statement-breakpoint
CREATE TABLE `VISITA_DRAFTS` (
	`ID` text PRIMARY KEY NOT NULL,
	`PLAN_ID` text,
	`PAYLOAD_JSON` text NOT NULL,
	`UPDATED_AT` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `VISITA` (
	`ID` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`ID_PLANEJAMENTO` text,
	`PRIMEIRA_VISITA` text,
	`SEGUNDA_VISITA` text,
	`TIPO_VISITA` text,
	`NUMERO_QUARTOS` text,
	`CONTEM_AMOSTRA` integer,
	`CONTEM_TRATAMENTO` integer,
	`SEQUENCIA` integer,
	`LATITUDE` real,
	`LONGITUDE` real,
	`SITUACAO_REFERENCIA` integer,
	`SITUACAO` integer,
	`CEP` text,
	`NOME` text,
	`NUMERO` text,
	`COMPLEMENTO` text
);
--> statement-breakpoint
CREATE INDEX `IDX_VISITA_PLAN` ON `VISITA` (`ID_PLANEJAMENTO`,`SEQUENCIA`);