import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { primaryColor } from '@root/components/_default/colors';
import { router } from 'expo-router';
import InternetStatusMonitor from '@root/components/_default/internet/InternetStatusMonitor';
import { MAINSERVICE, SOCKETSERVICEURL } from '@root/constants/urls';
import useUserStore from '@root/context/userContext';
import { DATABASE_NAME } from '@root/constants/database';
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export default function Chat() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    async function getConversas() {
      const usuario = await db.getFirstSync(`SELECT ID FROM USUARIO`, []);
      axios.get(SOCKETSERVICEURL + '/users')
      .then(response => {
        const res = response.data
          .filter(item => item.id != usuario.ID) // Filtra apenas os itens que queremos
          .map(item => item); // Apenas retorna os itens restantes
          setConversations(res);
      })
      .catch(error => console.error('Erro ao carregar usuários:', error));    
    }
    getConversas();
  }, []);

  async function goToChat(id, nome) {
    const usuario = await db.getFirstSync(`SELECT ID FROM USUARIO`, []);
    router.navigate({pathname:'chat-message', params: { idUsuarioMensagem: id, nome: nome, usuarioLogado: usuario.ID }});
  }

  const renderItem = ({ item }) => {

    return (
      <TouchableOpacity style={styles.conversationItem} onPress={()=>goToChat(item.id, item.nome)}>
        {/* Avatar com a primeira letra do nome */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nome.charAt(0)}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.conversationName}>{item.nome}</Text>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>

        <View style={styles.rightContainer}>
          {item.unreadCount > 0 && (
            <View style={styles.unreadCountContainer}>
              <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <InternetStatusMonitor />
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    paddingHorizontal: 10,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#EADDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    color: primaryColor,
  },
  unreadCountContainer: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
