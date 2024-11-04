import Button from '@root/components/_default/button/Button';
import { primariaClara, primaryColor } from '@root/components/_default/colors';
import { Stack, useNavigation } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

const oldMessages = [
  { id: '1', text: 'Opa, bão? comim', sender: '', timestamp: new Date(Date.now() - 60 * 60 * 1000) },
  { id: '2', text: 'Tranquilovó', sender: 'Me', timestamp: new Date(Date.now() - 55 * 60 * 1000) },
];

export default function ChatMessages() {
  const [messages, setMessages] = useState(oldMessages);
  const [inputMessage, setInputMessage] = useState('');
  const navigation = useNavigation();
  const flatListRef = useRef(null); // Referência para o FlatList
  const [socket, setSocket] = useState(null); // Estado para armazenar a conexão WebSocket

  // Inicializa o WebSocket quando o componente monta
  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.44:8765'); // Substitua pelo IP do servidor WebSocket
    setSocket(ws);
  
    ws.onopen = () => {
      console.log('Conectado ao WebSocket');
    };
  
    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      const newMessage = {
        id: String(messages.length + 1),
        text: messageData.text,
        sender: messageData.sender,
        timestamp: new Date(messageData.timestamp),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
  
      // Role para a última mensagem
      flatListRef.current.scrollToEnd({ animated: true });
    };
  
    ws.onclose = () => {
      console.log('Desconectado do WebSocket');
      setTimeout(() => {
        // Tente reconectar após 5 segundos
        setSocket(new WebSocket('ws://192.168.1.44:8765'));
      }, 5000); 
    };
  
    ws.onerror = (error) => {
      console.log('Erro de WebSocket:', error.message);
    };
  
    return () => {
      ws.close(); 
    };
  }, []);
  

  useEffect(() => {
    navigation.setOptions({
      title: 'Marcelo',
    });
  }, [navigation]);

  const sendMessage = () => {
    if (inputMessage.trim() && socket && socket.readyState === WebSocket.OPEN) {
      const newMessage = {
        text: inputMessage,
        sender: 'Me',
        timestamp: new Date(),
      };
      
      // Envia a mensagem para o servidor WebSocket
      socket.send(JSON.stringify(newMessage));
  
      setInputMessage('');
    } else {
      console.log('WebSocket não está conectado');
    }
  };
  

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'Me' ? styles.myMessage : styles.theirMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.sender === 'Me' ? 'Você' : item.sender}, {item.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatListRef} // Adiciona a referência aqui
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.chatList}
        contentContainerStyle={{ paddingVertical: 10 }}
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
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: primariaClara, // Verde claro do WhatsApp
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
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: { 
    color: '#fff',
    fontSize: 16,
  },
});
