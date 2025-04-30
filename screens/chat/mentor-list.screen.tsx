import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import { URL_IMAGES, URL_SERVER } from '@/utils/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import io from 'socket.io-client';
import { useNavigation } from '@react-navigation/native';

interface Mentor {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: {
      url: string;
    };
  };
  bio: string;
  specialization: string[];
  averageRating: number;
  courses: any[];
}

const MentorListScreen = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    if (mentors.length > 0) {
      filterMentors();
    }
  }, [searchText, selectedSpecialization, mentors]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMentors();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!accessToken || !refreshToken) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem danh sách giảng viên');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${URL_SERVER}/all`, {
        headers: {
          'access-token': accessToken,
          'refresh-token': refreshToken
        }
      });
      
      if (response.data.success) {
        
        setMentors(response.data.mentors);
        setFilteredMentors(response.data.mentors);
        
      
        const allSpecializations = new Set<string>();
        response.data.mentors.forEach((mentor: Mentor) => {
          mentor.specialization?.forEach(spec => allSpecializations.add(spec));
        });
        
        setSpecializations(Array.from(allSpecializations));
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    let filtered = [...mentors];
    
   
    if (searchText) {
      filtered = filtered.filter(mentor => 
        mentor.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        mentor.bio.toLowerCase().includes(searchText.toLowerCase()) ||
        mentor.specialization.some(spec => 
          spec.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
  
    if (selectedSpecialization) {
      filtered = filtered.filter(mentor => 
        mentor.specialization.includes(selectedSpecialization)
      );
    }
    
    setFilteredMentors(filtered);
  };

  const startChat = async (mentor: Mentor) => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!accessToken || !refreshToken) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để chat với mentor');
        setLoading(false);
        return;
      }
      
     
      const response = await axios.post(`${URL_SERVER}/chat/private`, {
        mentorId: mentor._id
      }, {
        headers: {
          'access-token': accessToken,
          'refresh-token': refreshToken
        }
      });
      
      if (response.data.success) {
        
        router.push({
          pathname: "/chat/[id]",
          params: { id: response.data.chat._id }
        });
      } else {
        Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const viewMentorProfile = (mentorId: string) => {
    router.push({
      pathname: "/mentor-profile",
      params: { mentorId }
    });
  };

  const renderMentorItem = ({ item }: { item: Mentor }) => {
    const avatarUrl = item.user.avatar?.url
      ? `${URL_IMAGES}/${item.user.avatar.url}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.name)}&background=0D8ABC&color=fff`;
      
    return (
      <View style={styles.mentorCard}>
        <TouchableOpacity 
          style={styles.mentorInfo}
          onPress={() => viewMentorProfile(item._id)}
        >
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.mentorAvatar} 
          />
          <View style={styles.mentorDetails}>
            <Text style={styles.mentorName}>{item.user.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>
                {item.averageRating ? item.averageRating.toFixed(1) : 'N/A'}
              </Text>
              <Text style={styles.coursesText}>
                {item.courses?.length || 0} khóa học
              </Text>
            </View>
            <View style={styles.specializationContainer}>
              {item.specialization.slice(0, 2).map((spec, index) => (
                <View key={index} style={styles.specializationTag}>
                  <Text style={styles.specializationText}>{spec}</Text>
                </View>
              ))}
              {item.specialization.length > 2 && (
                <Text style={styles.moreText}>+{item.specialization.length - 2}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => startChat(item)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSpecializationItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedSpecialization === item && styles.filterChipSelected
      ]}
      onPress={() => {
        setSelectedSpecialization(
          selectedSpecialization === item ? null : item
        );
      }}
    >
      <Text 
        style={[
          styles.filterChipText,
          selectedSpecialization === item && styles.filterChipTextSelected
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchMentors();
      return () => {};
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMentors();
    setRefreshing(false);
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách giảng viên</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, chuyên môn..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Feather name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.filtersContainer}>
        <FlatList
          data={specializations}
          keyExtractor={(item) => item}
          renderItem={renderSpecializationItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
          <Text style={styles.loadingText}>Đang tải danh sách mentor...</Text>
        </View>
      ) : filteredMentors.length > 0 ? (
        <FlatList
          data={filteredMentors}
          keyExtractor={(item) => item._id}
          renderItem={renderMentorItem}
          contentContainerStyle={styles.mentorsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#666']}
              tintColor="#666"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>Không tìm thấy mentor phù hợp</Text>
          <Text style={styles.emptySubtext}>Vui lòng thử tìm kiếm với từ khóa khác</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 18,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filtersContainer: {
    marginTop: 15,
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filterChipSelected: {
    backgroundColor: '#666',
    borderColor: '#666',
  },
  filterChipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
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
  mentorsList: {
    padding: 16,
    paddingBottom: 20,
  },
  mentorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 16,
  },
  mentorInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mentorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  mentorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  mentorName: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    marginRight: 12,
  },
  coursesText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: '#666',
  },
  specializationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specializationTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 8,
  },
  specializationText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: '#666',
  },
  moreText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    backgroundColor: '#2467EC',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#fff',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#555',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
  }
});

export default MentorListScreen; 