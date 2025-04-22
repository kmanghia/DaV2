import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { URL_IMAGES, URL_SERVER } from '@/utils/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ChatPreview {
  _id: string;
  name?: string;
  chatType: 'private' | 'course';
  participants: {
    _id: string;
    name: string;
    avatar?: {
      url: string;
    };
  }[];
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
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
}

const ChatListScreen = () => {
  const [privateChats, setPrivateChats] = useState<ChatPreview[]>([]);
  const [courseChats, setCourseChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'private', 'course'
  const [userId, setUserId] = useState<string | null>(null);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  useEffect(() => {
    const getUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (storedUserId) {
        // Lưu vào global state để các màn hình khác sử dụng
        (global as any).userId = storedUserId;
        console.log('Set global userId in chat-list:', storedUserId);
      }
      setUserId(storedUserId);
      loadChats();
    };
    getUserData();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const currentUserId = userId || await AsyncStorage.getItem('user_id');
      
      if (!accessToken || !refreshToken) {
        console.error('No auth tokens found');
        return;
      }
      
      console.log('Calling chats API...');
      const response = await axios.get(`${URL_SERVER}/chat/all`, {
        headers: {
          'access-token': accessToken,
          'refresh-token': refreshToken
        }
      });
      console.log('Chats API response:', response.data);

      if (!response || !response.data) {
        console.error('Response is null or missing data');
        throw new Error('Failed to fetch chat data');
      }
      
      if (response.data.success) {
        // Process chats to extract last message and unread count
        const processedPrivateChats = response.data.privateChats.map((chat: any) => {
          const otherParticipant = chat.participants.find((p: any) => p._id !== currentUserId);
          return {
            ...chat,
            name: otherParticipant?.name || 'Unknown User',
            avatar: otherParticipant?.avatar,
            lastMessage: chat.messages && chat.messages.length > 0 ? 
              chat.messages[chat.messages.length - 1] : undefined,
            unreadCount: chat.messages ? 
              chat.messages.filter((msg: any) => !msg.readBy.includes(currentUserId)).length : 0
          };
        });
        
        setPrivateChats(processedPrivateChats);
        setCourseChats(response.data.courseChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const navigateToChat = (chatId: string) => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: chatId }
    });
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => {
    // Determine the correct name and avatar to display
    let name = '';
    let avatarUrl = '';
    let subtitle = '';
    
    if (item.chatType === 'private') {
      // For private chats, show the other participant's name
      const otherParticipant = item.participants.find(p => p._id !== userId);
      name = otherParticipant?.name || 'Unknown User';
      avatarUrl = otherParticipant?.avatar?.url || '';
      subtitle = 'Direct message';
    } else {
      // For course chats, show the course name
      name = item.name || item.courseId?.name || 'Course Chat';
      avatarUrl = item.courseId?.thumbnail?.url || '';
      subtitle = 'Course group chat';
    }
    
    // Format the last updated time
    const updatedAt = new Date(item.updatedAt);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));
    
    let timeText;
    if (diffHours < 24) {
      // Today, show time
      timeText = updatedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (diffHours < 48) {
      // Yesterday
      timeText = 'Yesterday';
    } else {
      // More than 2 days, show date
      timeText = updatedAt.toLocaleDateString();
    }
    
    return (
      <TouchableOpacity 
        style={styles.chatItem} 
        onPress={() => navigateToChat(item._id)}
      >
        <View style={styles.avatarContainer}>
          {item.chatType === 'private' ? (
            <Image 
              source={{ 
                uri: avatarUrl ? 
                  `${URL_IMAGES}/${avatarUrl}` : 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff` 
              }}
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.courseAvatarContainer]}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: `${URL_IMAGES}/${avatarUrl}` }}
                  style={styles.courseAvatar} 
                />
              ) : (
                <MaterialIcons name="group" size={24} color="#fff" />
              )}
            </View>
          )}
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{name}</Text>
            <Text style={styles.chatTime}>{timeText}</Text>
          </View>
          <View style={styles.chatFooter}>
            <View style={styles.subtitleContainer}>
              {item.chatType === 'course' && (
                <FontAwesome name="users" size={12} color="#666" style={styles.subtitleIcon} />
              )}
              <Text style={styles.chatSubtitle} numberOfLines={1}>
                {item.lastMessage ? item.lastMessage.content : subtitle}
              </Text>
            </View>
            {item.chatType === 'course' && (
              <View style={styles.chatTypeBadge}>
                <Text style={styles.chatTypeText}>Group</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={70} color="#ddd" />
      <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'private' 
          ? 'Bắt đầu cuộc hội thoại bằng cách truy cập trang cá nhân của giảng viên'
          : activeTab === 'course' 
            ? 'Mua khóa học để tham gia nhóm chat của khóa học'
            : 'Các cuộc hội thoại của bạn sẽ hiển thị ở đây'}
      </Text>
    </View>
  );

  const getFilteredChats = () => {
    switch (activeTab) {
      case 'private':
        return privateChats;
      case 'course':
        return courseChats;
      default:
        return [...privateChats, ...courseChats].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Tin nhắn</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'private' && styles.activeTab]} 
          onPress={() => setActiveTab('private')}
        >
          <Text style={[styles.tabText, activeTab === 'private' && styles.activeTabText]}>Cá nhân</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'course' && styles.activeTab]} 
          onPress={() => setActiveTab('course')}
        >
          <Text style={[styles.tabText, activeTab === 'course' && styles.activeTabText]}>Nhóm</Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070e0" />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredChats()}
          renderItem={renderChatItem}
          keyExtractor={item => item._id}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0070e0']}
            />
          }
        />
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Raleway_700Bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#0070e0',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e1e1e1',
  },
  courseAvatarContainer: {
    backgroundColor: '#0070e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FF3D71',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subtitleIcon: {
    marginRight: 5,
  },
  chatSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    flex: 1,
  },
  chatTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  chatTypeText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: '#0070e0',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 72,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ChatListScreen; 