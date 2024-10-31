import { DATABASE_NAME } from "@root/constants/database";
import * as SQLite from 'expo-sqlite';

export async function insertUsuario(usuario){
    const CRIAR_USUARIO_INSERT = `REPLACE INTO USUARIO (nome, email, id_cede, ID_IMAGEM_PERFIL_USUARIO) VALUES ($NOME, $EMAIL, $IDCEDE, $IDIMAGEMPERFIL);`

    let usuarioInserido = null;

    try{
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        console.log(usuario)
        usuarioInserido = await db.runAsync(CRIAR_USUARIO_INSERT, 
            {NOME: usuario.nome, EMAIL: usuario.nome, IDCEDE: usuario.idCede, IDIMAGEMPERFIL: usuario.idImagemPerfilUsuario});

    } catch (e) {
        console.log(e);
    }

    return usuarioInserido;
}

async function buscarUsuario(){
    const BUSCAR_USUARIO_SELECT = `SELECT * FROM USUARIO`

    await db.getAllAsync(BUSCAR_USUARIO_SELECT, 
        { $NOME: 'aaa' }
    );
    const usuario = {};
    
    for (const row of allRows) {
        usuario = {
            nome: row.nome,
        };
    }

    return usuario;
}