import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { URL_IMAGES, URL_SERVER } from '@/utils/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import io from 'socket.io-client';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name?: string;
  };
  content: string;
  readBy: string[];
  createdAt: string;
}

interface ChatParticipant {
  _id: string;
  name: string;
  avatar?: {
    url: string;
  };
}

interface ChatDetails {
  _id: string;
  name?: string;
  chatType: 'private' | 'course';
  participants: ChatParticipant[];
  courseId?: {
    _id: string;
    name: string;
    thumbnail: {
      url: string;
    };
  };
  mentorId: {
    _id: string;
    user?: string;
  };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const ChatDetailScreen = () => {
  const { chatId } = useLocalSearchParams();
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList | null>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  useEffect(() => {
    const getTokens = async () => {
      const access = await AsyncStorage.getItem('access_token');
      const refresh = await AsyncStorage.getItem('refresh_token');
      const user = await AsyncStorage.getItem('user_id');
      
      setAccessToken(access);
      setRefreshToken(refresh);
      setUserId(user);

      if (access && refresh && user) {
        loadChat(access, refresh);
        initializeSocket(user);
      }
    };

    getTokens();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId]);

  const initializeSocket = (user: string) => {
    try {
      if (!socketRef.current) {
        console.log('Initializing socket connection...');
        const socketUrl = URL_SERVER || 'http://localhost:8000';
        socketRef.current = io(socketUrl, {
          transports: ['websocket'],
          query: { userId: user }
        });

        // Socket connection events
        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          socketRef.current.emit('authenticate', user);
          
          if (chatId) {
            console.log(`Joining chat room: ${chatId}`);
            socketRef.current.emit('joinChat', chatId);
          }
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socketRef.current.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
        });

        // Chat specific events
        socketRef.current.on('newMessage', (data: any) => {
          console.log('New message received:', data);
          if (data.chatId === chatId) {
            setChat(prevChat => {
              if (!prevChat) return null;
              
              // Add the new message to the chat
              const updatedMessages = [...prevChat.messages, data.message];
              return { ...prevChat, messages: updatedMessages };
            });

            // Mark message as read
            if (data.message.sender._id !== user) {
              markMessageAsRead(data.message._id);
            }
          }
        });

        socketRef.current.on('userTyping', (data: any) => {
          if (data.chatId === chatId && data.userId !== user) {
            if (data.isTyping) {
              setTypingUsers(prev => new Set(prev).add(data.userId));
            } else {
              setTypingUsers(prev => {
                const updated = new Set(prev);
                updated.delete(data.userId);
                return updated;
              });
            }
          }
        });

        socketRef.current.on('messagesRead', (data: any) => {
          if (data.chatId === chatId) {
            setChat(prevChat => {
              if (!prevChat) return null;
              
              // Update read status for messages
              const updatedMessages = prevChat.messages.map(msg => {
                if (data.messageIds.includes(msg._id) && !msg.readBy.includes(data.userId)) {
                  return {
                    ...msg,
                    readBy: [...msg.readBy, data.userId]
                  };
                }
                return msg;
              });
              
              return { ...prevChat, messages: updatedMessages };
            });
          }
        });
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  const loadChat = async (access: string, refresh: string) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${URL_SERVER}/chat/${chatId}`, {
        headers: {
          'access-token': access,
          'refresh-token': refresh
        }
      });
      
      if (response.data.success) {
        setChat(response.data.chat);
        
        // Scroll to bottom when chat loads
        setTimeout(() => {
          if (flatListRef.current && response.data.chat.messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    
    // Handle typing indicator
    if (socketRef.current) {
      if (!isTyping && text.length > 0) {
        setIsTyping(true);
        socketRef.current.emit('typing', { 
          chatId, 
          userId, 
          isTyping: true 
        });
      }
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          socketRef.current.emit('typing', { 
            chatId, 
            userId, 
            isTyping: false 
          });
        }
      }, 3000);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current || !userId) return;
    
    try {
      socketRef.current.emit('sendMessage', {
        chatId,
        message: message.trim(),
        senderId: userId
      });
      
      setMessage('');
      setIsTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing stopped event
      socketRef.current.emit('typing', { 
        chatId, 
        userId, 
        isTyping: false 
      });
      
      // Hide keyboard on send
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (!socketRef.current || !userId) return;
    
    socketRef.current.emit('markAsRead', {
      chatId,
      messageIds: [messageId],
      userId
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender._id === userId;
    const readByOthers = chat?.participants
      .filter(p => p._id !== userId)
      .some(p => item.readBy.includes(p._id));
    
    // Format message timestamp
    const messageDate = new Date(item.createdAt);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const timeString = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: chat?.participants.find(p => p._id === item.sender._id)?.avatar?.url ?
                  `${URL_IMAGES}/${chat?.participants.find(p => p._id === item.sender._id)?.avatar?.url}` :
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(item.sender.name || 'User')}&background=0D8ABC&color=fff`
              }}
              style={styles.avatar}
            />
          </View>
        )}
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {!isOwnMessage && chat?.chatType === 'course' && (
            <Text style={styles.senderName}>
              {chat.participants.find(p => p._id === item.sender._id)?.name || 'Unknown User'}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {timeString}
          </Text>
          
          {isOwnMessage && (
            <View style={styles.readStatus}>
              {readByOthers ? (
                <Ionicons name="checkmark-done" size={16} color="#0070e0" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#999" />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    let title = '';
    let subtitle = '';
    let avatarUrl = '';
    
    if (chat) {
      if (chat.chatType === 'private') {
        // For private chats, show the other participant's name
        const otherParticipant = chat.participants.find(p => p._id !== userId);
        title = otherParticipant?.name || 'Unknown User';
        subtitle = 'Direct message';
        avatarUrl = otherParticipant?.avatar?.url || '';
      } else {
        // For course chats, show the course name
        title = chat.name || chat.courseId?.name || 'Course Chat';
        subtitle = `${chat.participants.length} participants`;
        avatarUrl = chat.courseId?.thumbnail?.url || '';
      }
    }
    
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          {chat?.chatType === 'private' ? (
            <Image
              source={{
                uri: avatarUrl ? 
                  `${URL_IMAGES}/${avatarUrl}` : 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=0D8ABC&color=fff`
              }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.courseAvatarContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: `${URL_IMAGES}/${avatarUrl}` }}
                  style={styles.headerAvatar}
                />
              ) : (
                <MaterialIcons name="group" size={24} color="#fff" />
              )}
            </View>
          )}
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {typingUsers.size > 0 ? 
                typingUsers.size === 1 ? 'Typing...' : 'Multiple people typing...' : 
                subtitle}
            </Text>
          </View>
        </View>
        
        {chat?.chatType === 'course' && (
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#0070e0" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderDateSeparator = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    let dateText;
    if (messageDate.toDateString() === now.toDateString()) {
      dateText = 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      dateText = 'Yesterday';
    } else {
      dateText = messageDate.toLocaleDateString();
    }
    
    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateSeparatorText}>{dateText}</Text>
      </View>
    );
  };

  const renderMessageList = () => {
    if (!chat) return null;
    
    // Group messages by date
    const messagesByDate: {[key: string]: Message[]} = {};
    chat.messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!messagesByDate[date]) {
        messagesByDate[date] = [];
      }
      messagesByDate[date].push(message);
    });
    
    // Flatten the grouped messages with date separators
    const flattenedMessages: (Message | {_id: string, type: 'date', date: string})[] = [];
    Object.entries(messagesByDate).forEach(([date, messages]) => {
      flattenedMessages.push({
        _id: `date-${date}`,
        type: 'date',
        date
      } as any);
      flattenedMessages.push(...messages);
    });
    
    return (
      <FlatList
        ref={flatListRef}
        data={flattenedMessages}
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'date') {
            return renderDateSeparator(item.date);
          }
          return renderMessage({ item: item as Message });
        }}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
    );
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070e0" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {renderMessageList()}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={message}
              onChangeText={handleMessageChange}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={message.trim() ? '#fff' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  courseAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0070e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
  },
  infoButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#999',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
  },
  ownMessageContent: {
    backgroundColor: '#0070e0',
    borderTopRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  readStatus: {
    position: 'absolute',
    bottom: 4,
    right: -20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#0070e0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

export default ChatDetailScreen; 