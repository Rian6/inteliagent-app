import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { primaryColor } from '@root/components/_default/colors';
import { router } from 'expo-router';

const conversations = [
  { id: '1', name: 'John Doe', lastMessage: 'Hey, how are you?', time: new Date(), unreadCount: 2 },
  { id: '2', name: 'Jane Smith', lastMessage: 'Let’s meet tomorrow!', time: new Date(), unreadCount: 0 },
  { id: '3', name: 'Bob Brown', lastMessage: 'Can you send me the files?', time: new Date(), unreadCount: 5 },
];

export default function Chat() {

  function goToChat(){
    router.push('tabs/application/chat/chatMessages')
  }

  const renderItem = ({ item }) => {
    const currentTime = new Date();
    const isMoreThan24h = (currentTime - item.time) / (1000 * 60 * 60) > 24;
    const formattedTime = isMoreThan24h
      ? format(item.time, 'dd/MM/yyyy')
      : format(item.time, 'HH:mm');

    return (
      <TouchableOpacity style={styles.conversationItem} onPress={goToChat}>
        {/* Avatar com a primeira letra do nome */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>

        {/* Nome e última mensagem */}
        <View style={styles.textContainer}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>

        {/* Data e contagem de mensagens não lidas */}
        <View style={styles.rightContainer}>
          <Text style={styles.timeText}>{formattedTime}</Text>
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
    paddingTop: 50,
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
