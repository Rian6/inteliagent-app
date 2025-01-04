import { primariaClara, primaryColor } from '@root/components/_default/colors';
import { SOCKETSERVICEURL } from '@root/constants/urls';
import { useGlobalSearchParams, useNavigation } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'socket.io-client';

export default function ChatMessages() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();

  const { idUsuarioMensagem, nome, usuarioLogado } = useGlobalSearchParams();

  // Inicializa o WebSocket ao montar o componente
  useEffect(() => {
    const socket = io(SOCKETSERVICEURL);
    setSocket(socket);

    socket.on('connect', () => {
      console.log('Conectado ao servidor Socket.IO');
      // Emitindo evento para carregar mensagens anteriores
      socket.emit('load_messages', { id: usuarioLogado });
    });

    socket.on('all_messages', (loadedMessages) => {
      // Filtrando as mensagens para incluir tanto as enviadas quanto as recebidas
      const filteredMessages = loadedMessages.filter(
        (msg) => msg.sender == usuarioLogado || msg.recipient == usuarioLogado
      );
      setMessages(filteredMessages);
    });

    socket.on('receive_message', (message) => {
      // Verificando se a mensagem recebida é para o usuário logado
      if (message.sender == idUsuarioMensagem || message.recipient == idUsuarioMensagem) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, [usuarioLogado, idUsuarioMensagem]);



  useEffect(() => {
    navigation.setOptions({
      title: nome,
    });
  }, [navigation]);

  const sendMessage = () => {
    if (inputMessage.trim() && socket) {
      const newMessage = {
        sender: usuarioLogado,
        recipient: idUsuarioMensagem,
        text: inputMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      console.log("Enviando mensagem:", newMessage);  // Log para depuração

      socket.emit('send_message', newMessage, (response) => {
        if (response.success) {
          console.log('Mensagem enviada com sucesso');
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          setInputMessage('');
        } else {
          console.log('Falha ao enviar a mensagem');
        }
      });
      setInputMessage('');
    } else {
      console.log('Mensagem vazia ou WebSocket não está conectado');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender == usuarioLogado ? styles.myMessage : styles.theirMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.sender === usuarioLogado ? 'Você' : nome}, {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => String(index)}
        contentContainerStyle={styles.chatList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          value={inputMessage}
          onChangeText={setInputMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatList: {
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: primariaClara,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEAEA',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#555',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#A9007A',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
