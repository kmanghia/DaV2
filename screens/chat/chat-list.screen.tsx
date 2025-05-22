import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar as RNStatusBar,
  Platform,
  ImageBackground,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { URL_IMAGES, URL_SERVER } from '@/utils/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

interface ChatPreview {
  _id: string;
  name?: string;
  participants: {
    _id: string;
    name: string;
    avatar?: {
      url: string;
    };
  }[];
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
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  useFocusEffect(
    useCallback(() => {
      const getUserData = async () => {
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId) {
          (global as any).userId = storedUserId;
        }
        setUserId(storedUserId);
        loadChats();
      };
      getUserData();
      
      return () => {};
    }, [])
  );

  const loadChats = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const currentUserId = userId || await AsyncStorage.getItem('user_id');
      
      if (!accessToken || !refreshToken) {
        return;
      }
      
      const response = await axios.get(`${URL_SERVER}/chat/all`, {
        headers: {
          'access-token': accessToken,
          'refresh-token': refreshToken
        }
      });
      
      if (!response || !response.data) {
        throw new Error('Tải dữ liệu trò chuyện thất bại.');
      }
      
      if (response.data.success) {
        const processedChats = response.data.privateChats.map((chat: any) => {
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
        
        setChats(processedChats);
      }
    } catch (error) {
      // Handle error
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
    let name = '';
    let avatarUrl = '';
    let subtitle = '';
    
    const otherParticipant = item.participants.find(p => p._id !== userId);
    name = otherParticipant?.name || 'Unknown User';
    avatarUrl = otherParticipant?.avatar?.url || '';
    subtitle = 'Nhắn tin riêng';
    
    const updatedAt = new Date(item.updatedAt);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));
    
    let timeText;
    if (diffHours < 24) {
      timeText = updatedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (diffHours < 48) {
      timeText = 'Yesterday';
    } else {
      timeText = updatedAt.toLocaleDateString();
    }
    
    const hasUnread = item.unreadCount && item.unreadCount > 0;
    
    return (
      <TouchableOpacity 
        style={[styles.chatItem, hasUnread ? styles.unreadChatItem : null]} 
        onPress={() => navigateToChat(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: avatarUrl ? 
                `${URL_IMAGES}/${avatarUrl}` : 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff` 
            }}
            style={styles.avatar} 
          />
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount! > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, hasUnread ? styles.unreadChatName : null]} numberOfLines={1}>{name}</Text>
            <Text style={styles.chatTime}>{timeText}</Text>
          </View>
          <View style={styles.chatFooter}>
            <View style={styles.subtitleContainer}>
              <Text style={[styles.chatSubtitle, hasUnread ? styles.unreadChatSubtitle : null]} numberOfLines={1}>
                {item.lastMessage ? item.lastMessage.content : subtitle}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color="#e0e0e0" />
      <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
      <Text style={styles.emptySubtext}>
        Bắt đầu cuộc hội thoại bằng cách truy cập trang cá nhân của giảng viên
      </Text>
    </View>
  );

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Tin nhắn</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/mentors')}
              >
                <Feather name="users" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Feather name="search" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chatCountRow}>
            <View style={styles.countItem}>
              <Text style={styles.countNumber}>{chats.length}</Text>
              <Text style={styles.countLabel}>Tổng tin nhắn</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#666" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={item => item._id}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#666']}
                tintColor="#666"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    marginTop: -50,
  },
  header: {
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: -30
  },
  title: {
    fontSize: 26,
    fontFamily: 'Raleway_700Bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  chatCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  countItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  countNumber: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  countLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
    marginTop: 3,
  },
  countDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  unreadChatItem: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#666',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eaeaea',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unreadBadge: {
    position: 'absolute',
    right: -3,
    top: -3,
    backgroundColor: '#FF3D71',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 5,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
  },
  chatContent: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
    flex: 1,
  },
  unreadChatName: {
    color: '#333',
    fontWeight: 'bold',
  },
  chatTime: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    color: '#666',
  },
  chatSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    flex: 1,
    opacity: 0.8,
  },
  unreadChatSubtitle: {
    fontFamily: 'Nunito_700Bold',
    color: '#555',
    opacity: 1,
  },
  separator: {
    height: 0,
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
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#555',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default ChatListScreen; 