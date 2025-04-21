import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator,
    FlatList,
    TextInput,
    Alert
} from 'react-native';
import { Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway";
import { Nunito_600SemiBold, Nunito_500Medium, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { useFonts } from 'expo-font';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { URL_SERVER, URL_IMAGES } from '@/utils/url';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import CourseCard from '@/components/cards/course.card';
import useUser from '@/hooks/useUser';

const MentorProfileScreen = () => {
    const { mentorId } = useLocalSearchParams();
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('about'); // 'about', 'courses', 'reviews', 'students'
    const { user, loading: userLoading } = useUser();
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentCount, setStudentCount] = useState(0);
    
    // Rating form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    let [fontsLoaded, fontError] = useFonts({
        Raleway_700Bold,
        Raleway_600SemiBold,
        Nunito_600SemiBold,
        Nunito_500Medium,
        Nunito_700Bold,
    });

    const submitReview = async () => {
        if (!user) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để đánh giá');
            return;
        }
        
        if (comment.trim().length < 5) {
            Alert.alert('Thông báo', 'Vui lòng nhập nhận xét ít nhất 5 ký tự');
            return;
        }

        // Check if user has enrolled in any of mentor's courses
        const userCourseIds = user.progress?.map((p: any) => p.courseId) || [];
        const mentorCourseIds = mentor.courses?.map((c: any) => c._id) || [];
        
        const hasEnrolledCourse = userCourseIds.some((courseId: string) => 
            mentorCourseIds.includes(courseId)
        );

        if (!hasEnrolledCourse) {
            Alert.alert('Thông báo', 'Bạn cần tham gia ít nhất 1 khóa học của mentor này để có thể đánh giá');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            const response = await axios.post(`${URL_SERVER}/review`, {
                mentorId,
                rating,
                comment
            }, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            if (response.data.success) {
                Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi thành công');
                setComment('');
                
                // Refresh mentor data to show the new review
                fetchMentorDetails();
            } else {
                Alert.alert('Lỗi', response.data.message || 'Có lỗi xảy ra khi gửi đánh giá');
            }
        } catch (err: any) {
            console.error('Error submitting review:', err);
            Alert.alert(
                'Lỗi', 
                err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchMentorDetails = async () => {
        try {
            console.log('Fetching mentor details for ID:', mentorId);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            const response = await axios.get(`${URL_SERVER}/${mentorId}?populate=true`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            console.log('Mentor API Response:', response.data);
            
            if (response.data.success) {
                setMentor(response.data.mentor);
            } else {
                setError('Failed to fetch mentor details');
            }
        } catch (err: any) {
            console.error('Error fetching mentor details:', err);
            setError('Error loading mentor profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorStudents = async () => {
        setLoadingStudents(true);
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            const response = await axios.get(`${URL_SERVER}/students/${mentorId}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            console.log("Students response:", response.data);
            
            if (response.data.success) {
                setStudents(response.data.students);
                setStudentCount(response.data.students.length);
            }
        } catch (err: any) {
            console.error('Error fetching mentor students:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (mentorId) {
            fetchMentorDetails();
            fetchMentorStudents();
        }
    }, [mentorId]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2467EC" />
            </View>
        );
    }

    if (error || !mentor) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'Mentor not found'}</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const mentorAvatar = mentor.user?.avatar?.url
        ? `${URL_IMAGES}/${mentor.user.avatar.url}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.user?.name || 'Mentor')}`;
    
    const renderAboutTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Giới thiệu</Text>
                <Text style={styles.bioText}>{mentor.bio}</Text>
            </View>
            
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Chuyên môn</Text>
                <View style={styles.tagContainer}>
                    {mentor.specialization?.map((spec: string, index: number) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{spec}</Text>
                        </View>
                    ))}
                </View>
            </View>
            
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thành tựu</Text>
                {mentor.achievements?.length > 0 ? (
                    <View>
                        {mentor.achievements.map((achievement: string, index: number) => (
                            <View key={index} style={styles.achievementItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#2467EC" />
                                <Text style={styles.achievementText}>{achievement}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>Chưa có thông tin thành tựu</Text>
                )}
            </View>
        </View>
    );
//     <View style={{width: wp(90), marginTop: 10, marginBottom: 10}} key={course._id}>
//     <CourseCard item={course} isHorizontal={true}/>
// </View>
{/* <CourseCard item={item} isHorizontal={true}/> */}
    const renderCoursesTab = () => (
        <View style={styles.tabContent}>
            {mentor.courses?.length > 0 ? (
                <FlatList
                    data={mentor.courses}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.courseItemContainer}>
                            <CourseCard item={item} isHorizontal={true}/>
                        </View>
                    )}
                    contentContainerStyle={styles.courseList}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.courseSeparator} />}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="book-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Mentor chưa có khóa học nào</Text>
                </View>
            )}
        </View>
    );
    
    const renderReviewForm = () => {
        if (!user) {
            return (
                <View style={styles.reviewFormContainer}>
                    <Text style={styles.reviewFormTitle}>Đăng nhập để đánh giá</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return (
            <View style={styles.reviewFormContainer}>
                <Text style={styles.reviewFormTitle}>Đánh giá giảng viên</Text>
                
                <View style={styles.ratingInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity 
                            key={star} 
                            onPress={() => setRating(star)}
                            style={styles.starButton}
                        >
                            <Ionicons 
                                name={star <= rating ? "star" : "star-outline"} 
                                size={30} 
                                color="#FFB800" 
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TextInput
                    style={styles.commentInput}
                    placeholder="Nhập nhận xét của bạn..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#999"
                />
                
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isSubmitting || comment.trim().length < 5) && styles.disabledButton
                    ]}
                    onPress={submitReview}
                    disabled={isSubmitting || comment.trim().length < 5}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };
    
    const renderReviewsTab = () => (
        <View style={styles.tabContent}>
            {renderReviewForm()}
            
            <View style={styles.reviewsContainer}>
                <Text style={styles.reviewsTitle}>
                    Đánh giá ({mentor.reviews?.length || 0})
                </Text>
                
                {mentor.reviews?.length > 0 ? (
                    <FlatList
                        data={mentor.reviews}
                        keyExtractor={(item, index) => `review-${index}`}
                        renderItem={({ item }) => (
                            <View style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewUser}>
                                        <Image 
                                            source={{ 
                                                uri: user?.avatar?.url 
                                                    ? `${URL_IMAGES}/${item.user.avatar.url}` 
                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || 'User')}` 
                                            }} 
                                            style={styles.reviewAvatar} 
                                        />
                                        <View>
                                            <Text style={styles.reviewName}>{item.user?.name || 'Người dùng ẩn danh'}</Text>
                                            <Text style={styles.reviewDate}>
                                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.ratingContainer}>
                                        {Array(5).fill(0).map((_, i) => (
                                            <Ionicons 
                                                key={i}
                                                name={i < item.rating ? "star" : "star-outline"} 
                                                size={16} 
                                                color="#FFB800" 
                                            />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewComment}>{item.comment}</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.reviewList}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderStudentsTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Học viên</Text>
            
            {loadingStudents ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2467EC" />
                </View>
            ) : students.length > 0 ? (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.studentItem}>
                            <Image 
                                source={{ 
                                    uri: item.avatar?.url 
                                        ? `${URL_IMAGES}/${item.avatar.url}` 
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Student')}` 
                                }} 
                                style={styles.studentAvatar} 
                            />
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{item.name || 'Học viên'}</Text>
                                <Text style={styles.studentEmail}>{item.email}</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.studentsList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có học viên nào</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết giảng viên</Text>
                <View style={{ width: 24 }} />
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <Image 
                        source={{ uri: mentorAvatar }} 
                        style={styles.profileAvatar} 
                    />
                    <Text style={styles.profileName}>{mentor.user?.name}</Text>
                    
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{studentCount}</Text>
                            <Text style={styles.statLabel}>Học viên</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{mentor.courses?.length || 0}</Text>
                            <Text style={styles.statLabel}>Khóa học</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{mentor.averageRating?.toFixed(1) || "N/A"}</Text>
                            <Text style={styles.statLabel}>Đánh giá</Text>
                        </View>
                    </View>
                </View>
                
                {/* Tab Navigation */}
                <View style={styles.tabBar}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'about' && styles.activeTabButton]} 
                        onPress={() => setActiveTab('about')}
                    >
                        <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                            Giới thiệu
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'courses' && styles.activeTabButton]} 
                        onPress={() => setActiveTab('courses')}
                    >
                        <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>
                            Khóa học
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'reviews' && styles.activeTabButton]} 
                        onPress={() => setActiveTab('reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                            Đánh giá
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'students' && styles.activeTabButton]} 
                        onPress={() => setActiveTab('students')}
                    >
                        <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
                            Học viên
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* Tab Content */}
                {activeTab === 'about' && renderAboutTab()}
                {activeTab === 'courses' && renderCoursesTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'students' && renderStudentsTab()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#ff6b6b',
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#2467EC',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
        marginTop: 25
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontFamily: 'Raleway_700Bold',
        fontSize: 18,
        color: '#333',
        
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#2467EC',
    },
    profileName: {
        fontFamily: 'Raleway_700Bold',
        fontSize: 22,
        color: '#333',
        marginBottom: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        width: '90%',
        backgroundColor: '#F5F7FE',
        borderRadius: 10,
        padding: 15,
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#ddd',
    },
    statValue: {
        fontFamily: 'Raleway_700Bold',
        fontSize: 24,
        color: '#2467EC',
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#666',
    },
    tabBar: {
        flexDirection: 'row',
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#2467EC',
    },
    tabText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#2467EC',
        fontWeight: 'bold',
    },
    tabContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    infoSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Raleway_600SemiBold',
        fontSize: 18,
        color: '#333',
        marginBottom: 10,
    },
    bioText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#F5F7FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 13,
        color: '#2467EC',
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    achievementText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
    },
    courseItemContainer: {
        marginHorizontal: 5,
        marginVertical: 5,
    },
    courseSeparator: {
        height: 15,
    },
    courseList: {
        paddingBottom: 20,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
    },
    reviewList: {
        paddingBottom: 20,
    },
    reviewItem: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewUser: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    reviewName: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
    },
    reviewComment: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 5,
    },
    reviewDate: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    reviewFormContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    reviewFormTitle: {
        fontFamily: 'Raleway_600SemiBold',
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    ratingInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    starButton: {
        padding: 5,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#333',
        marginBottom: 15,
    },
    submitButton: {
        backgroundColor: '#2467EC',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#a0b4e0',
    },
    submitButtonText: {
        color: '#fff',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
    },
    reviewsContainer: {
        marginTop: 10,
    },
    reviewsTitle: {
        fontFamily: 'Raleway_600SemiBold',
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    loginButton: {
        backgroundColor: '#2467EC',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
    },
    studentsList: {
        paddingBottom: 10,
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    studentAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontFamily: 'Raleway_600SemiBold',
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    studentEmail: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#777',
    },
});

export default MentorProfileScreen; 