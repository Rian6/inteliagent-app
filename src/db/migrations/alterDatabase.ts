// src/migrations/alterDatabase.js
export const alterSQLStatements = [    
    `ALTER TABLE visita ADD COLUMN CEP TEXT;`,
    `ALTER TABLE visita ADD COLUMN NOME TEXT;`,
    `ALTER TABLE visita ADD COLUMN NUMERO INTEGER;`,
    `ALTER TABLE visita ADD COLUMN COMPLEMENTO TEXT;`,
  ];
  