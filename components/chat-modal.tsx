import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Raleway_600SemiBold } from '@expo-google-fonts/raleway';
import { Nunito_500Medium } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';


// Define your backend URL where the LMS-RAG-Chatbot is running
// Make sure this matches your backend's actual port (likely 5000)
const BACKEND_URL = 'http://192.168.1.6:8080';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  animation?: Animated.Value;
}

interface ChatModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatModal = ({ isVisible, onClose, userId }: ChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const user = useSelector((state: any) => state.user);
  
  // Animation refs
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Nunito_500Medium,
  });

  // Handle modal visibility animations
  useEffect(() => {
    if (isVisible) {
      // Animate modal in
      Animated.parallel([
        Animated.timing(overlayAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate modal out
      Animated.parallel([
        Animated.timing(overlayAnimation, {
          toValue: 0,
          duration: 700,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(modalAnimation, {
          toValue: 0,
          duration: 800,
          delay: 50,
          easing: Easing.bezier(0.36, 0.07, 0.19, 0.97),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      // Connect to socket server when component mounts
      try {
        socketRef.current = io(BACKEND_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
        });
        
        // Socket event listeners
        socketRef.current.on('connect', () => {
          console.log('Connected to server');
        });
        
        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from server');
        });
        
        socketRef.current.on('response', (data: any) => {
          console.log('Received response:', data);
          if (data && data.content) {
            const animation = new Animated.Value(0);
            const botResponse: Message = {
              id: Date.now().toString(),
              content: data.content,
              isUser: false,
              timestamp: new Date(),
              animation: animation
            };
            setMessages(prevMessages => [...prevMessages, botResponse]);
            setIsLoading(false);
            
            // Animate message in
            Animated.timing(animation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic)
            }).start();
          }
        });
        
        socketRef.current.on('error', (error: any) => {
          console.error('Socket error:', error);
          const animation = new Animated.Value(0);
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
            isUser: false,
            timestamp: new Date(),
            animation: animation
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
          setIsLoading(false);
          
          // Animate message in
          Animated.timing(animation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }).start();
        });
      } catch (error) {
        console.error('Error connecting to socket:', error);
      }

      // Add welcome message if no messages exist
      if (messages.length === 0) {
        const animation = new Animated.Value(0);
        setMessages([
          {
            id: '0',
            content: 'Xin chào! Tôi là trợ lý EduBot. Bạn cần hỗ trợ gì không?',
            isUser: false,
            timestamp: new Date(),
            animation: animation
          },
        ]);
        
        // Animate welcome message in
        Animated.timing(animation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          delay: 500,
          easing: Easing.out(Easing.cubic)
        }).start();
      }

      // Load chat history
      fetchChatHistory();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isVisible]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/history/${userId}`);
      const data = await response.json();
      
      if (data.statusCode === 200 && data.data) {
        // Get the most recent session
        const sessions = data.data;
        const sessionNumbers = Object.keys(sessions);
        
        if (sessionNumbers.length > 0) {
          const latestSession = sessionNumbers[sessionNumbers.length - 1];
          const sessionMessages = sessions[latestSession];
          
          const formattedMessages = sessionMessages.map((msg: any, index: number) => ({
            id: index.toString(),
            content: msg.content,
            isUser: msg.is_user,
            timestamp: new Date(msg.created_at),
            animation: new Animated.Value(1) // Already visible for history
          }));
          
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    // Create animated message
    const animation = new Animated.Value(0);
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      animation: animation
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Animate message in
    Animated.timing(animation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();

    try {
      // First try socket.io for realtime messaging
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('message', {
          content: inputMessage,
          userId: userId
        });
      } else {
        // Fall back to REST API if socket is not connected
        const response = await fetch(`${BACKEND_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: inputMessage,
            userId: userId,
          }),
        });

        const data = await response.json();
        
        if (data.statusCode === 200) {
          const botAnimation = new Animated.Value(0);
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: data.data.content,
            isUser: false,
            timestamp: new Date(),
            animation: botAnimation
          };
          
          setMessages(prevMessages => [...prevMessages, botResponse]);
          setIsLoading(false);
          
          // Animate bot response in
          Animated.timing(botAnimation, {
            toValue: 1,
            duration: 500,
            delay: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }).start();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorAnimation = new Animated.Value(0);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date(),
        animation: errorAnimation
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setIsLoading(false);
      
      // Animate error message in
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }).start();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Use the animation value or create a default one
    const messageAnimation = item.animation || new Animated.Value(1);
    
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.botMessage,
          {
            opacity: messageAnimation,
            transform: [
              { 
                translateY: messageAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                  extrapolate: 'clamp'
                }) 
              },
              {
                scale: messageAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 0.9, 1],
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}
      >
        <Text style={[
          styles.messageText, 
          { color: item.isUser ? '#FFFFFF' : '#000000' }
        ]}>
          {item.content}
        </Text>
      </Animated.View>
    );
  };

  // Animation styles
  const overlayStyle = {
    opacity: overlayAnimation
  };

  const modalStyle = {
    transform: [
      {
        translateY: modalAnimation.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [SCREEN_HEIGHT, SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.05, 0],
          extrapolate: 'clamp'
        })
      },
      {
        scale: modalAnimation.interpolate({
          inputRange: [0, 0.5, 0.8, 1],
          outputRange: [0.85, 0.92, 0.98, 1],
          extrapolate: 'clamp'
        })
      },
      // Thêm hiệu ứng rotate nhẹ khi đóng mở modal
      {
        rotate: modalAnimation.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: ['2deg', '1deg', '0deg'],
          extrapolate: 'clamp'
        })
      }
    ],
    opacity: modalAnimation.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 0.6, 0.9, 1],
      extrapolate: 'clamp'
    })
  };

  const loaderAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loaderAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(loaderAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      ).start();
    } else {
      loaderAnimation.setValue(0);
    }
  }, [isLoading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.modalOverlay, overlayStyle]}>
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trợ lý học tập AI</Text>
          <TouchableOpacity 
            onPress={() => {
              setTimeout(() => {
                onClose();
              }, 100);
            }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={500}
            />
            {isLoading ? (
              <Animated.View 
                style={[
                  styles.sendButton,
                  {
                    opacity: loaderAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      scale: loaderAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.85, 1.0, 1.15],
                        extrapolate: 'clamp'
                      })
                    }]
                  }
                ]}
              >
                <ActivityIndicator size="small" color="#2467EC" />
              </Animated.View>
            ) : (
              <TouchableOpacity 
                onPress={sendMessage} 
                style={styles.sendButton}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={24} color="#2467EC" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Raleway_600SemiBold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2467EC',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: 'Nunito_500Medium',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatModal; 