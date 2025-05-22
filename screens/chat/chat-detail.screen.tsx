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
  Keyboard,
  Alert,
  Modal,
  Dimensions,
  Linking
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { URL_IMAGES, URL_SERVER, URL_VIDEO } from '@/utils/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

interface Attachment {
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name?: string;
  };
  content: string;
  readBy: string[];
  createdAt: string;
  attachments?: Attachment[];
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
  participants: ChatParticipant[];
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
  
  
  
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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

  // Add new state for image viewer
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  useEffect(() => {
    
    
    // Kiểm tra nếu có userId trong global state
    if ((global as any).userId) {
      console.log((global as any).userId);
    } else {
      
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
          
        } else if (user) {
          // Lưu vào global state để sử dụng sau này
          (global as any).userId = user;
          
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
        
        setError('Lỗi khi cài đặt hội thoại');
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    setupChat();

    return () => {
      
      if (socketRef.current) {
        
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [chatId]);

  const initializeSocket = (user: string) => {
    try {
      if (!socketRef.current) {
        
        // Loại bỏ api/v1 khỏi URL server để có đúng URL socket
        const socketUrl = URL_SERVER.replace('/api/v1', '');
        
        
        // Kiểm tra cấu trúc URL hợp lệ
        if (!socketUrl.startsWith('http')) {
          
          setError('URL kết nối socket không hợp lệ');
          return;
        }
        
      
        socketRef.current = io(socketUrl, {
          transports: ['websocket'],
          query: { userId: user },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });

        
        socketRef.current.on('connect', () => {
          
          socketRef.current.emit('authenticate', user);
          
          if (chatId) {
            
            socketRef.current.emit('joinChat', chatId);
          }
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socketRef.current.on('connect_error', (error: any) => {
          
          setError('Không thể kết nối đến server chat');
        });

        socketRef.current.on('newMessage', (data: any) => {
        
          
          
          
          
          if (data.chatId === chatId) {
          
            if (!data.message || typeof data.message !== 'object') {
              
              return;
            }
            
            if (typeof data.message.sender === 'string') {
              
              const senderId = data.message.sender;
              data.message.sender = { _id: senderId };
            
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
            
                
                
                const isFromMentor = mentorUserId && mentorUserId === data.message.sender._id;
                
                
              
                if (prevChat.mentorInfo?.user && !data.message.sender.name) {
                  data.message.sender.name = prevChat.mentorInfo.user.name || 'User';
                } else if (!data.message.sender.name) {
                  data.message.sender.name = 'User';
                }
                
              
                if (!prevChat.mentorInfo && accessToken && refreshToken) {
                  
                  (async () => {
                    try {
                      
                      const mentorIdValue = typeof prevChat.mentorId === 'object' ? 
                        prevChat.mentorId._id : 
                        prevChat.mentorId;
                      
                    
                      
                      const mentorInfo = await fetchMentorInfo(
                        mentorIdValue, 
                        accessToken, 
                        refreshToken
                      );
                      
                      if (mentorInfo) {
                        
                        setChat(currentChat => {
                          if (!currentChat) return null;
                          return {...currentChat, mentorInfo};
                        });
                      }
                    } catch (err) {
                    
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
        
        
       
        if (chatId) {
  
          socketRef.current.emit('joinChat', chatId);
        }
      }
    } catch (error) {
    
      setError('Lỗi khi khởi tạo kết nối chat');
    }
  };

  const loadChat = async (access: string, refresh: string) => {
    try {
      if (!chatId) {
        
        setError('Chat ID is missing');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
     
      
      const response = await axios.get(`${URL_SERVER}/chat/${chatId}`, {
        headers: {
          'access-token': access,
          'refresh-token': refresh
        }
      }).catch(error => {
        if (error.response) {
         
          
          if (error.response.status === 404) {
            setError('Chat không tồn tại');
          } else if (error.response.status === 403) {
            setError('Bạn không có quyền xem hội thoại này');
          } else {
            setError('Lỗi khi tải hội thoại');
          }
        } else if (error.request) {
          
          setError('Không thể kết nối đến máy chủ');
        } else {
        
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
         
            
            const mentorInfo = await fetchMentorInfo(mentorIdValue, access, refresh);
            if (mentorInfo) {
              chatData.mentorInfo = mentorInfo;
              
            } else {
              
            }
          } catch (err) {
            
          }
        } else {
          
        }
        
        setChat(chatData);
        
       
        setTimeout(() => {
          if (flatListRef.current && chatData.messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } else {
        
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
      
      
      const response = await axios.get(`${URL_SERVER}/${mentorId}`, {
        headers: {
          'access-token': access,
          'refresh-token': refresh
        }
      });
      
     
      
      if (response.data && response.data.success && response.data.mentor) {
       
        return response.data.mentor;
      } else {
        
      }
      return null;
    } catch (error: any) {
      
      if (error.response) {
       
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

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (attachments.length >= 5) {
         
          return;
        }
        
        // Upload the image
        await uploadAttachment(asset.uri, asset.fileName || 'image.jpg', asset.mimeType || 'image/jpeg', asset.fileSize || 0);
      }
    } catch (error) {
    
    }
  };
  
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (attachments.length >= 5) {
        
          return;
        }
        
        await uploadAttachment(asset.uri, asset.name || 'document', asset.mimeType || 'application/octet-stream', asset.size || 0);
      }
    } catch (error) {
      
    }
  };
  
  const uploadAttachment = async (uri: string, fileName: string, mimeType: string, fileSize: number) => {
    if (!accessToken || !refreshToken) {
      
      return;
    }
    
    setIsUploading(true);
    
    try {
      
      const formData = new FormData();
      formData.append('files', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);
      
      
      const response = await axios.post(`${URL_SERVER}/chat/upload-attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'access-token': accessToken,
          'refresh-token': refreshToken
        }
      });
      
      if (response.data.success && response.data.attachments) {
        setAttachments(prev => [...prev, ...response.data.attachments]);
      } else {

      }
    } catch (error) {
 
    } finally {
      setIsUploading(false);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const sendMessage = () => {
    if ((!message.trim() && attachments.length === 0) || !socketRef.current || !userId) return;
    
    try {
      socketRef.current.emit('sendMessage', {
        chatId,
        message: message.trim(),
        senderId: userId,
        attachments
      });
      
      setMessage('');
      setAttachments([]);
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
    
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (!socketRef.current || !userId || !messageId) {
      
      return;
    }
    
    
    
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
      return null;
    }
    
    const isOwnMessage = item.sender._id === userId;
    const readByOthers = chat?.participants
      .filter(p => p._id !== userId)
      .some(p => item.readBy.includes(p._id));
    
    // Format message timestamp
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
    
    const renderAttachments = () => {
      if (!item.attachments || item.attachments.length === 0) return null;
      
      return (
        <View style={styles.attachmentsContainer}>
          {item.attachments.map((attachment, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.attachmentItem}
              onPress={() => handleAttachmentPress(attachment)}
            >
              {attachment.type === 'image' ? (
                <Image 
                  source={{ uri: `${URL_IMAGES}/${attachment.url}` }} 
                  style={styles.attachmentImage} 
                  resizeMode="cover"
                />
              ) : attachment.type === 'video' ? (
                <View style={styles.attachmentFileContainer}>
                  <MaterialIcons name="video-file" size={24} color="#ff6b6b" />
                  <Text style={styles.attachmentFileName} numberOfLines={1}>
                    {attachment.filename}
                  </Text>
                </View>
              ) : attachment.type === 'audio' ? (
                <View style={styles.attachmentFileContainer}>
                  <MaterialIcons name="audio-file" size={24} color="#5f27cd" />
                  <Text style={styles.attachmentFileName} numberOfLines={1}>
                    {attachment.filename}
                  </Text>
                </View>
              ) : (
                <View style={styles.attachmentFileContainer}>
                  <MaterialIcons name="insert-drive-file" size={24} color="#0070e0" />
                  <Text style={styles.attachmentFileName} numberOfLines={1}>
                    {attachment.filename}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
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
          {item.content.trim().length > 0 && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          {renderAttachments()}
          
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
      
      subtitle = 'Nhắn tin riêng';
    }
    
    const testFetchMentor = async () => {
      const mentorIdValue = chat?.mentorId ? 
        (typeof chat.mentorId === 'object' ? chat.mentorId._id : chat.mentorId) : 
        null;
      
      if (mentorIdValue && accessToken && refreshToken) {
        const mentorInfo = await fetchMentorInfo(mentorIdValue, accessToken, refreshToken);
        if (mentorInfo) {
          setChat(currentChat => {
            if (!currentChat) return null;
            return {...currentChat, mentorInfo};
          });
        }
      }
    };
    
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image
            source={{
              uri: avatarUrl ? 
                `${URL_IMAGES}/${avatarUrl}` : 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=0D8ABC&color=fff`
            }}
            style={styles.headerAvatar}
          />
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {typingUsers.size > 0 ? 
                typingUsers.size === 1 ? 'Typing...' : 'Multiple people typing...' : 
                subtitle}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={{...styles.infoButton, backgroundColor: '#ff9800'}} 
          onPress={testFetchMentor}>
          <Text style={{color: 'white', fontSize: 10}}>Test</Text>
        </TouchableOpacity>
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
    
      return null;
    }
    
  
    
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
      
       
        (message as any).sender = { _id: message.sender };
      }
      
      return true;
    });
    
   
    
   
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
      
    }
    
    return null;
  };

  // Add attachment preview component
  const renderAttachmentPreviews = () => {
    if (attachments.length === 0) return null;
    
    return (
      <View style={styles.attachmentPreviewContainer}>
        <FlatList
          data={attachments}
          horizontal
          renderItem={({ item, index }) => (
            <View style={styles.attachmentPreview}>
              {item.type === 'image' ? (
                <Image 
                  source={{ uri: `${URL_IMAGES}/${item.url}` }} 
                  style={styles.previewImage} 
                />
              ) : (
                <View style={styles.previewFileContainer}>
                  <MaterialIcons 
                    name={
                      item.type === 'video' ? 'video-file' : 
                      item.type === 'audio' ? 'audio-file' : 
                      'insert-drive-file'
                    } 
                    size={24} 
                    color="#0070e0" 
                  />
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {item.filename}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeAttachmentButton}
                onPress={() => removeAttachment(index)}
              >
                <Ionicons name="close-circle" size={20} color="#ff3d71" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(_, index) => `attachment-${index}`}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  // Add a function to handle attachment viewing
  const handleAttachmentPress = async (attachment: Attachment) => {
    if (attachment.type === 'image') {
      // For images, show full-screen viewer
      setSelectedImage(`${URL_IMAGES}/${attachment.url}`);
      setImageViewerVisible(true);
    } else {
      try {
        // For other files (PDFs, etc.), download and open with appropriate viewer
        const fileUrl = `${URL_VIDEO}/${attachment.type}s/${attachment.url}`;
        console.log("FILEPDF:"+fileUrl)
        // For web browser, we can simply open the URL
        if (Platform.OS === 'web') {
          window.open(fileUrl, '_blank');
          return;
        }
        
        // Try to open directly with the default app
        try {
          const supported = await Linking.canOpenURL(fileUrl);
          if (supported) {
            await Linking.openURL(fileUrl);
            return;
          }
        } catch (error) {
          
        }
        
       
        
        try {
          
          const result = await WebBrowser.openBrowserAsync(fileUrl);
          
          return;
        } catch (error) {
          
        }
        
        
        try {
        
          const tempFilePath = `${FileSystem.cacheDirectory}${attachment.filename}`;
          
  
          const downloadResult = await FileSystem.downloadAsync(
            fileUrl,
            tempFilePath
          );
          
          if (downloadResult.status === 200) {
            
            const localUri = `file://${tempFilePath}`;
            await Linking.openURL(localUri);
          } else {
            
          }
        } catch (error) {
         
        }
      } catch (error) {
     
      }
    }
  };
  
  // Add image viewer component
  const renderImageViewer = () => {
    return (
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeImageViewerButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    );
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {renderHeader()}
      {renderImageViewer()}
      
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
          
          {renderAttachmentPreviews()}
          
          <View style={styles.inputContainer}>
            <View style={styles.attachmentButtonsContainer}>
              <TouchableOpacity 
                style={styles.attachmentButton}
                onPress={pickImage}
                disabled={isUploading}
              >
                <MaterialIcons name="image" size={24} color="#0070e0" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.attachmentButton}
                onPress={pickDocument}
                disabled={isUploading}
              >
                <MaterialIcons name="attach-file" size={24} color="#0070e0" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              value={message}
              onChangeText={handleMessageChange}
              multiline
              maxLength={1000}
            />
            
            {isUploading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!message.trim() && attachments.length === 0) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!message.trim() && attachments.length === 0}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={message.trim() || attachments.length > 0 ? '#fff' : '#ccc'}
                />
              </TouchableOpacity>
            )}
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
  attachmentButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 4,
  },
  attachmentPreviewContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  previewFileName: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  attachmentItem: {
    width: 150,
    height: 120,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentFileContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  attachmentFileName: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingButton: {
    marginLeft: 12,
    backgroundColor: '#0070e0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeImageViewerButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});

export default ChatDetailScreen; 