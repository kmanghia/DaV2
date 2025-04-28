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

interface MentorInfo {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: {
      url: string;
    };
  };
  reviews?: any[];
  courses?: any[];
  bio?: string;
  specialization?: string[];
  experience?: number;
  status?: string;
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
  mentorInfo?: MentorInfo;
}

interface ChatDetailScreenProps {
  chatId?: string;
}

const ChatDetailScreen = ({ chatId: propChatId }: ChatDetailScreenProps) => {
  const params = useLocalSearchParams();
  
  // Log toàn bộ params để debug
  console.log('All params from useLocalSearchParams:', params);
  console.log('Prop chatId:', propChatId);
  
  // Xử lý nhiều trường hợp khác nhau cho ID
  let chatId: string | undefined = propChatId;
  
  if (!chatId && params.id) {
    if (typeof params.id === 'string') {
      chatId = params.id;
    } else if (Array.isArray(params.id) && params.id.length > 0) {
      chatId = String(params.id[0]);
    } else {
      chatId = String(params.id);
    }
  } else if (!chatId && params.chatId) {
    // Check alternative param name
    if (typeof params.chatId === 'string') {
      chatId = params.chatId;
    } else if (Array.isArray(params.chatId) && params.chatId.length > 0) {
      chatId = String(params.chatId[0]);
    } else {
      chatId = String(params.chatId);
    }
  }
  
  console.log('Final chat ID to use:', chatId, typeof chatId);
  
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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
    console.log('Running main useEffect, chatId:', chatId);
    
    // Kiểm tra nếu có userId trong global state
    if ((global as any).userId) {
      console.log('Found userId in global state:', (global as any).userId);
    } else {
      console.log('No userId in global state, will retrieve from AsyncStorage');
    }
    
    const setupChat = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy token từ AsyncStorage
        const access = await AsyncStorage.getItem('access_token');
        const refresh = await AsyncStorage.getItem('refresh_token');
        let user = await AsyncStorage.getItem('user_id');
        
        // Sử dụng userId từ global state nếu có
        if ((global as any).userId && !user) {
          user = (global as any).userId;
          console.log('Using userId from global state:', user);
        } else if (user) {
          // Lưu vào global state để sử dụng sau này
          (global as any).userId = user;
          console.log('Updated global userId from AsyncStorage:', user);
        } else {
          
          user = await getUserIdFromToken(access);
          if (user) {
            console.log('Retrieved user ID from token:', user);
            AsyncStorage.setItem('user_id', user);
            (global as any).userId = user;
          }
        }
        
        console.log('Auth info:', { 
          hasAccessToken: !!access, 
          hasRefreshToken: !!refresh, 
          hasUserId: !!user,
          hasChatId: !!chatId
        });
        
        setAccessToken(access);
        setRefreshToken(refresh);
        setUserId(user);

        if (access && refresh && user && chatId) {
          await loadChat(access, refresh);
          initializeSocket(user);
        } else {
          console.error('Missing required values for chat');
          
          // Hiển thị thông báo lỗi cụ thể hơn
          if (!access || !refresh) {
            setError('Vui lòng đăng nhập lại để tiếp tục');
          } else if (!user) {
            setError('Không tìm thấy thông tin người dùng');
          } else if (!chatId) {
            setError('Không tìm thấy ID hội thoại');
          } else {
            setError('Thiếu thông tin xác thực hoặc ID hội thoại');
          }
        }
      } catch (err) {
        console.error('Error in setupChat:', err);
        setError('Lỗi khi cài đặt hội thoại');
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    setupChat();

    return () => {
      console.log('Component unmounting, cleaning up resources');
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        console.log('Clearing typing timeout');
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [chatId]);

  const initializeSocket = (user: string) => {
    try {
      if (!socketRef.current) {
        console.log('Initializing socket connection...');
        // Loại bỏ api/v1 khỏi URL server để có đúng URL socket
        const socketUrl = URL_SERVER.replace('/api/v1', '');
        console.log('Socket URL:', socketUrl);
        
        // Kiểm tra cấu trúc URL hợp lệ
        if (!socketUrl.startsWith('http')) {
          console.error('Invalid socket URL:', socketUrl);
          setError('URL kết nối socket không hợp lệ');
          return;
        }
        
        console.log('Connecting to socket with userId:', user);
        socketRef.current = io(socketUrl, {
          transports: ['websocket'],
          query: { userId: user },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });

        
        socketRef.current.on('connect', () => {
          console.log('Socket connected successfully');
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
          setError('Không thể kết nối đến server chat');
        });

        socketRef.current.on('newMessage', (data: any) => {
          console.log('New message received:', data);
          
          
          console.log('Message sender structure:', typeof data.message.sender, JSON.stringify(data.message.sender, null, 2));
          
          if (data.chatId === chatId) {
          
            if (!data.message || typeof data.message !== 'object') {
              console.error('Invalid message format received:', data.message);
              return;
            }
            
            if (typeof data.message.sender === 'string') {
              
              const senderId = data.message.sender;
              data.message.sender = { _id: senderId };
              console.log('Converted string sender to object:', data.message.sender);
            }
            
            setChat(prevChat => {
              if (!prevChat) return null;
              
           
              const senderExists = prevChat.participants.some(
                p => p._id === data.message.sender._id
              );
              
              
              const mentorUserId = typeof prevChat.mentorId === 'object' ? 
                prevChat.mentorId?.user : 
                null;
              
             
              if (!senderExists && prevChat.mentorId) {
                console.log('Message from unrecognized sender detected - likely a mentor');
                
                
                const isFromMentor = mentorUserId && mentorUserId === data.message.sender._id;
                console.log('Is confirmed from mentor:', isFromMentor);
                
              
                if (prevChat.mentorInfo?.user && !data.message.sender.name) {
                  data.message.sender.name = prevChat.mentorInfo.user.name || 'User';
                } else if (!data.message.sender.name) {
                  data.message.sender.name = 'User';
                }
                
              
                if (!prevChat.mentorInfo && accessToken && refreshToken) {
                  
                  (async () => {
                    try {
                      // Extract mentorId correctly
                      const mentorIdValue = typeof prevChat.mentorId === 'object' ? 
                        prevChat.mentorId._id : 
                        prevChat.mentorId;
                      
                      console.log('Attempting to fetch mentor info after message receipt:', mentorIdValue);
                      
                      const mentorInfo = await fetchMentorInfo(
                        mentorIdValue, 
                        accessToken, 
                        refreshToken
                      );
                      
                      if (mentorInfo) {
                        console.log('Fetched mentor info after receiving message:', mentorInfo.user?.name || "Unknown mentor");
                        setChat(currentChat => {
                          if (!currentChat) return null;
                          return {...currentChat, mentorInfo};
                        });
                      }
                    } catch (err) {
                      console.error('Error fetching mentor info after message:', err);
                    }
                  })();
                }
              }
              
            
              const messageToAdd = {
                ...data.message,
                sender: {
                  _id: typeof data.message.sender === 'string' ? data.message.sender : data.message.sender._id,
                  name: typeof data.message.sender === 'string' ? 'User' : (data.message.sender.name || 'User')
                },
                readBy: Array.isArray(data.message.readBy) ? data.message.readBy : []
              };
              
              // Add the new message to the chat
              const updatedMessages = [...prevChat.messages, messageToAdd];
              return { ...prevChat, messages: updatedMessages };
            });

            // Mark message as read if we're not the sender
            const messageId = data.message._id;
            const senderId = typeof data.message.sender === 'string' ? 
              data.message.sender : 
              data.message.sender._id;
              
            if (senderId !== user && messageId) {
              markMessageAsRead(messageId);
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
      } else {
        console.log('Socket already initialized');
        
       
        if (chatId) {
          console.log(`Re-joining chat room: ${chatId}`);
          socketRef.current.emit('joinChat', chatId);
        }
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      setError('Lỗi khi khởi tạo kết nối chat');
    }
  };

  const loadChat = async (access: string, refresh: string) => {
    try {
      if (!chatId) {
        console.error('Chat ID is missing or invalid');
        setError('Chat ID is missing');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      console.log(`Loading chat with ID: ${chatId}`);
      console.log(`API URL: ${URL_SERVER}/chat/${chatId}`);
      
      const response = await axios.get(`${URL_SERVER}/chat/${chatId}`, {
        headers: {
          'access-token': access,
          'refresh-token': refresh
        }
      }).catch(error => {
        if (error.response) {
          console.error('API response error:', error.response.status, error.response.data);
          
          if (error.response.status === 404) {
            setError('Chat không tồn tại');
          } else if (error.response.status === 403) {
            setError('Bạn không có quyền xem hội thoại này');
          } else {
            setError('Lỗi khi tải hội thoại');
          }
        } else if (error.request) {
          console.error('No response from server:', error.request);
          setError('Không thể kết nối đến máy chủ');
        } else {
          console.error('Error setting up request:', error.message);
          setError('Lỗi kết nối');
        }
        throw error;
      });
      
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      
      if (response && response.data && response.data.success) {
        console.log('Chat loaded successfully');
        console.log('Chat data structure:', Object.keys(response.data.chat));
        
        if (!response.data.chat) {
          setError('Dữ liệu chat không hợp lệ');
          setLoading(false);
          return;
        }
        
        // Kiểm tra cấu trúc dữ liệu
        if (!response.data.chat.messages) {
          console.error('Chat object does not contain messages array');
          setError('Dữ liệu chat không chứa tin nhắn');
          setLoading(false);
          return;
        }
        
      
        const chatData = response.data.chat;
        
  
        const mentorIdValue = typeof chatData.mentorId === 'object' ? 
          chatData.mentorId?._id : 
          chatData.mentorId;
          
        if (mentorIdValue) {
          try {
            console.log('DEBUG: Trying to fetch mentor info for mentor ID:', mentorIdValue);
            console.log('DEBUG: Raw mentorId value is:', JSON.stringify(chatData.mentorId, null, 2));
            
            const mentorInfo = await fetchMentorInfo(mentorIdValue, access, refresh);
            if (mentorInfo) {
              chatData.mentorInfo = mentorInfo;
              console.log('Added mentor info to chat:', mentorInfo.user?.name || "Unknown mentor");
              console.log('Full mentor info:', JSON.stringify(mentorInfo, null, 2));
            } else {
              console.log('DEBUG: fetchMentorInfo returned null');
            }
          } catch (err) {
            console.error('Error fetching mentor info:', err);
            // Continue without mentor info
          }
        } else {
          console.log('DEBUG: No mentorId found in chat data');
          console.log('DEBUG: Chat data structure:', Object.keys(chatData));
        }
        
        setChat(chatData);
        
       
        setTimeout(() => {
          if (flatListRef.current && chatData.messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } else {
        console.error('Response not successful:', response?.data);
        setError('Không thể tải hội thoại');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const fetchMentorInfo = async (mentorId: string, access: string, refresh: string): Promise<MentorInfo | null> => {
    try {
      console.log(`Fetching mentor info for ID: ${mentorId}`);
      console.log(`Using URL: ${URL_SERVER}/${mentorId}`);
      
      const response = await axios.get(`${URL_SERVER}/${mentorId}`, {
        headers: {
          'access-token': access,
          'refresh-token': refresh
        }
      });
      
      console.log('Mentor API response status:', response.status);
      console.log('Mentor API response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.success && response.data.mentor) {
        console.log('Mentor info fetched successfully:', response.data.mentor.user?.name || "Unknown");
        return response.data.mentor;
      } else {
        console.log('Mentor API returned success but no mentor data found');
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching mentor info:', error.message);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return null;
    }
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    
  
    if (socketRef.current) {
      if (!isTyping && text.length > 0) {
        setIsTyping(true);
        socketRef.current.emit('typing', { 
          chatId, 
          userId, 
          isTyping: true 
        });
      }
      
    
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
    
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
      
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      
      socketRef.current.emit('typing', { 
        chatId, 
        userId, 
        isTyping: false 
      });
      
      
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (!socketRef.current || !userId || !messageId) {
      console.log('Cannot mark message as read - missing socket, userId, or messageId');
      return;
    }
    
    console.log('Marking message as read:', messageId);
    
    socketRef.current.emit('markAsRead', {
      chatId,
      messageIds: [messageId],
      userId
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    
    if (!item || typeof item !== 'object' || !item.sender) {
      console.error('Invalid message item:', item);
      return null;
    }
    
    // Ensure sender is an object, not a string
    if (typeof item.sender === 'string') {
     
      console.error('Message with string sender detected in renderMessage:', item);
      return null;
    }
    
    const isOwnMessage = item.sender._id === userId;
    const readByOthers = chat?.participants
      .filter(p => p._id !== userId)
      .some(p => item.readBy.includes(p._id));
    
  // Format mpessage timestam
    const messageDate = new Date(item.createdAt);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const timeString = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
  
    const getSenderName = () => {
   
      const participantSender = chat?.participants.find(p => p._id === item.sender._id);
      if (participantSender?.name) return participantSender.name;
      
      
      const mentorUserId = typeof chat?.mentorId === 'object' ? 
        chat?.mentorId?.user : 
        null; 
      if (chat?.mentorInfo?.user) {
        
        if (mentorUserId && mentorUserId === item.sender._id) {
          return chat.mentorInfo.user.name || "User";
        }
        
   
        if (!participantSender) {
          return chat.mentorInfo.user.name || "Mentor";
        }
      }
      
      
      if (chat?.chatType === 'course' && !participantSender) {
        return "Mentor"; 
      }
      
   
      if (item.sender.name) return item.sender.name;
      
      // Fallback
      return 'User';
    };
    
   
    const getSenderAvatar = () => {
      
      const participantSender = chat?.participants.find(p => p._id === item.sender._id);
      if (participantSender?.avatar?.url) {
        return `${URL_IMAGES}/${participantSender.avatar.url}`;
      }
      
     
      const mentorUserId = typeof chat?.mentorId === 'object' ? 
        chat?.mentorId?.user : 
        null;
      
     
      if (chat?.mentorInfo?.user && ((mentorUserId && mentorUserId === item.sender._id) || !participantSender)) {
        if (chat.mentorInfo.user.avatar?.url) {
          return `${URL_IMAGES}/${chat.mentorInfo.user.avatar.url}`;
        }
      }
      
      
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(getSenderName())}&background=0D8ABC&color=fff`;
    };
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: getSenderAvatar() }}
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
              {getSenderName()}
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
        
        const otherParticipant = chat.participants.find(p => p._id !== userId);
        
        
        const mentorUserId = typeof chat.mentorId === 'object' ? 
          chat.mentorId?.user : 
          null;
        
        
        if (otherParticipant) {
          title = otherParticipant.name || 'User';
          avatarUrl = otherParticipant.avatar?.url || '';
        } else if (mentorUserId || (chat.mentorId && !otherParticipant)) {
         
          if (chat.mentorInfo?.user) {
            
            title = chat.mentorInfo.user.name || 'Mentor';
            avatarUrl = chat.mentorInfo.user.avatar?.url || '';
          } else {
            title = 'Mentor';
           
          }
        }
        
        subtitle = 'Direct message';
      } else {
        
        title = chat.name || chat.courseId?.name || 'Course Chat';
        subtitle = `${chat.participants.length} thành viên`;
        avatarUrl = chat.courseId?.thumbnail?.url || '';
      }
    }
    
    
    const testFetchMentor = async () => {
      
      const mentorIdValue = chat?.mentorId ? 
        (typeof chat.mentorId === 'object' ? chat.mentorId._id : chat.mentorId) : 
        null;
      
      if (mentorIdValue && accessToken && refreshToken) {
        console.log("DEBUG: Manually testing mentor fetch for:", mentorIdValue);
        console.log("DEBUG: Raw mentorId data:", JSON.stringify(chat?.mentorId, null, 2));
        
        const mentorInfo = await fetchMentorInfo(mentorIdValue, accessToken, refreshToken);
        console.log("DEBUG: Manual test result:", mentorInfo ? "SUCCESS" : "FAILED");
        if (mentorInfo) {
          console.log("DEBUG: Fetched mentor info:", JSON.stringify(mentorInfo, null, 2));
          console.log("DEBUG: Mentor user info:", JSON.stringify(mentorInfo.user, null, 2));
          
          
          setChat(currentChat => {
            if (!currentChat) return null;
            return {...currentChat, mentorInfo};
          });
          
          alert(`Mentor info fetched successfully!\nName: ${mentorInfo.user?.name || "Unknown"}\nEmail: ${mentorInfo.user?.email || "N/A"}`);
        } else {
          alert("Failed to fetch mentor info");
        }
      } else {
        console.log("DEBUG: Cannot test - missing mentorId or tokens");
        console.log("DEBUG: Chat object structure:", chat ? Object.keys(chat) : "No chat data");
        alert("Cannot test - missing mentorId or tokens");
      }
    };
    
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
        
        {}
        <TouchableOpacity 
          style={{...styles.infoButton, backgroundColor: '#ff9800'}} 
          onPress={testFetchMentor}>
          <Text style={{color: 'white', fontSize: 10}}>Test</Text>
        </TouchableOpacity>
        
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
    if (!chat) {
      console.log('No chat data available for rendering');
      return null;
    }
    
    console.log('Rendering message list, messages count:', chat.messages ? chat.messages.length : 0);
    
    // Kiểm tra nếu không có messages hoặc messages không phải là một mảng
    if (!Array.isArray(chat.messages) || chat.messages.length === 0) {
      return (
        <View style={styles.emptyChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={70} color="#ddd" />
          <Text style={styles.emptyChatText}>Chưa có tin nhắn nào</Text>
          <Text style={styles.emptyChatSubtext}>Hãy bắt đầu cuộc trò chuyện</Text>
        </View>
      );
    }
    
    
    const validMessages = chat.messages.filter(message => {
      
      if (!message || typeof message !== 'object') return false;
      if (!message.sender || !message._id) return false;
      
      
      if (typeof message.sender === 'string') {
        console.log('Found message with string sender, converting to object:', message._id);
       
        (message as any).sender = { _id: message.sender };
      }
      
      return true;
    });
    
    console.log(`Found ${chat.messages.length - validMessages.length} invalid messages that will be skipped`);
    
   
    const messagesByDate: {[key: string]: Message[]} = {};
    validMessages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!messagesByDate[date]) {
        messagesByDate[date] = [];
      }
      messagesByDate[date].push(message);
    });
    
    
    const flattenedMessages: (Message | {_id: string, type: 'date', date: string})[] = [];
    Object.entries(messagesByDate).forEach(([date, messages]) => {
      flattenedMessages.push({
        _id: `date-${date}`,
        type: 'date',
        date
      } as any);
      flattenedMessages.push(...messages);
    });
    
    console.log('Flattened messages count:', flattenedMessages.length);
    
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
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={70} color="#ddd" />
            <Text style={styles.emptyChatText}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptyChatSubtext}>Hãy bắt đầu cuộc trò chuyện</Text>
          </View>
        )}
      />
    );
  };

  
  const getUserIdFromToken = async (accessToken: string | null): Promise<string | null> => {
    if (!accessToken) return null;
    
    try {
      
      const response = await axios.get(`${URL_SERVER}/me`, {
        headers: {
          'access-token': accessToken
        }
      });
      
      if (response.data && response.data.user && response.data.user._id) {
        return response.data.user._id;
      }
    } catch (error) {
      console.error('Error retrieving user ID from token:', error);
    }
    
    return null;
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  console.log('Render state:', { 
    chatId, 
    hasChat: !!chat, 
    loading, 
    error,
    userId, 
    socketConnected: !!socketRef.current
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070e0" />
          <Text style={styles.loadingText}>Đang tải hội thoại...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={70} color="#ff3d71" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (accessToken && refreshToken && userId) {
                loadChat(accessToken, refreshToken);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !chat ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={70} color="#ff3d71" />
          <Text style={styles.errorText}>Không tìm thấy dữ liệu hội thoại</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (accessToken && refreshToken && userId) {
                loadChat(accessToken, refreshToken);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
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
              placeholder="Nhập tin nhắn..."
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0070e0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
  },
  emptyChatSubtext: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
  },
});

export default ChatDetailScreen; 