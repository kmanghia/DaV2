import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { URL_IMAGES, URL_SERVER } from '@/utils/url';
import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MentorList = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        console.log('Fetching mentors from:', `${URL_SERVER}/all`);
        const response = await axios.get(`${URL_SERVER}/all`, {
            headers: {
                'access-token': accessToken,
                'refresh-token': refreshToken
            }
        });
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          console.log('Number of mentors:', response.data.mentors?.length || 0);
          setMentors(response.data.mentors || []);
        } else {
          console.log('API returned success: false');
          setError('Failed to fetch mentors');
        }
      } catch (err) {
        const error = err as AxiosError;
        console.error('Error fetching mentors:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        setError('Failed to fetch mentors');
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const renderMentor = ({ item }: { item: any }) => {
    // Lấy thông tin avatar từ mentor
    const avatar = `${URL_IMAGES}/${item.user?.avatar?.url}` || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user?.name || 'Mentor');
    console.log('Rendering mentor:', item.user?.name, 'Avatar:', avatar);

    return (
      <TouchableOpacity 
        style={styles.mentorItem}
        onPress={() => router.push({
          pathname: '/(routes)/mentor-profile',
          params: { mentorId: item._id }
        })}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.mentorName} numberOfLines={1}>
          {(item.user?.name?.split(' ')[0]) || 'Mentor'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2467EC" />
      </View>
    );
  }

  if (error || mentors.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'No mentors available'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mentors}
        renderItem={renderMentor}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 5,
    marginHorizontal: -15,
  },
  mentorItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 80,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2467EC',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mentorName: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#333',
  }
});

export default MentorList; 