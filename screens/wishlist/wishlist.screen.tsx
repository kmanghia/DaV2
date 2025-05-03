import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader";
import { URL_SERVER, URL_IMAGES } from "@/utils/url";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, RefreshControl } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Toast } from "react-native-toast-notifications";
import { router } from "expo-router";
import { Feather, FontAwesome } from "@expo/vector-icons";

import { 
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useFonts } from "expo-font";
import { Nunito_400Regular, Nunito_500Medium, Nunito_700Bold, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import React from "react";
import * as userActions from "../../utils/store/actions";

interface LessonWishlistType {
    _id: string;
    courseId: string;
    lessonId: string;
    userId: string;
    type: string;
    createdAt: string;
    details?: {
        course: {
            _id: string;
            name: string;
            thumbnail: {
                url: string;
            };
        };
        lesson: {
            _id: string;
            title: string;
            videoSection: string;
            videoThumbnail?: {
                url: string;
            };
        };
    };
}

const WishListScreen = () => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [courses, setCourses] = useState<CoursesType[]>([]);
    const [filteredCourses, setFilterdCourses] = useState<CoursesType[]>([]);
    const [favoriteLesson, setFavoriteLesson] = useState<LessonWishlistType[]>([]);
    const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'lessons'
    const wishList = useSelector((state: any) => state.user.wishList);
    const [totalLessons, setTotalLessons] = useState(0);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterCourses();
    }, [courses]);

    useEffect(() => {
        filterCourses();
    }, [wishList]);

    useEffect(() => {
        if (filteredCourses.length > 0) {
            calculateTotalLessons();
        } else {
            setTotalLessons(0);
        }
    }, [filteredCourses]);
    
    // Thêm useEffect để debug và theo dõi activeTab
    useEffect(() => {
        console.log("Active tab changed to:", activeTab);
        
        // Nếu chuyển tab sang lessons, gọi lại fetchFavoriteLessons
        if (activeTab === 'lessons') {
            console.log("Reloading lessons data...");
            fetchFavoriteLessons();
        }
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            console.log("------ Bắt đầu tải dữ liệu yêu thích ------");
            
            // Sử dụng Promise.allSettled để đảm bảo tất cả các quá trình đều hoàn thành
            // dù thành công hay thất bại
            const results = await Promise.allSettled([
                fetchCourses(),
                fetchFavoriteLessons(),
                fetchAllWishlist() // Thêm để cập nhật redux store
            ]);
            
            // Log kết quả để debug
            results.forEach((result, index) => {
                const taskName = index === 0 ? "Fetch Courses" : index === 1 ? "Fetch Favorite Lessons" : "Fetch All Wishlist";
                if (result.status === "fulfilled") {
                    console.log(`${taskName}: Thành công`);
                } else {
                    console.log(`${taskName}: Thất bại - ${result.reason}`);
                }
            });
            
            console.log("------ Hoàn thành tải dữ liệu yêu thích ------");
            
            setLoading(false);
        } catch (error) {
            console.log("Error in fetchData:", error);
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setCourses([...response.data.courses]);
        } catch (error) {
            console.log("Error fetching courses:", error);
        }
    };

    const fetchFavoriteLessons = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            
            console.log("Đang lấy danh sách bài học yêu thích...");
            
            const response = await axios.get(`${URL_SERVER}/wishlist?type=lesson&withDetails=true`, {
                headers: {
                    "access-token": accessToken,
                    "refresh-token": refreshToken
                }
            });

            console.log("API response:", JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                if (response.data.data && response.data.data.length > 0) {
                    console.log("Số lượng bài học yêu thích:", response.data.data.length);
                    setFavoriteLesson(response.data.data);
                } else {
                    console.log("Không có bài học yêu thích");
                    setFavoriteLesson([]);
                }
            } else {
                console.log("API trả về success=false");
                setFavoriteLesson([]);
            }
        } catch (error) {
            console.log("Error fetching favorite lessons:", error);
            
            if (axios.isAxiosError(error)) {
                console.log("Status code:", error.response?.status);
                console.log("Response data:", error.response?.data);
                console.log("Error config:", {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                });
            }
            
            setFavoriteLesson([]);
        }
    };

    const fetchAllWishlist = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            const response = await axios.get(`${URL_SERVER}/wishlist`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            if(response.data && response.data.data){
                const _wishList = response.data.data.map((item: any) => ({
                    _id: item._id,
                    courseId: item.courseId,
                    userId: item.userId,
                    type: item.type,
                    lessonId: item.lessonId
                }));
                dispatch(userActions.saveWishList(_wishList));
            }
        } catch (error) {
            console.log("Error fetching all wishlist:", error);
        }
    };

    const filterCourses = () => {
        const _filtered = courses.filter(course => wishList.find((item: any) => item.courseId === course._id));
        setFilterdCourses(_filtered);
    };

    const calculateTotalLessons = () => {
        const total = filteredCourses.reduce((sum, course) => {
            return sum + (course.courseData ? course.courseData.length : 0);
        }, 0);
        setTotalLessons(total);
    };

    const handleRemoveFavoriteLesson = async (item: LessonWishlistType) => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            
            const response = await axios.delete(`${URL_SERVER}/wishlist/remove`, {
                headers: {
                    "access-token": accessToken,
                    "refresh-token": refreshToken,
                    "Content-Type": "application/json"
                },
                data: {
                    courseId: item.courseId,
                    lessonId: item.lessonId,
                    type: 'lesson'
                }
            });

            if (response.data.success) {
                Toast.show("Đã xóa bài học khỏi danh sách yêu thích", {
                    placement: "bottom",
                    type: "success"
                });

                // Cập nhật danh sách bài học yêu thích
                setFavoriteLesson(favoriteLesson.filter(lesson => lesson._id !== item._id));
            }
        } catch (error) {
            console.log("Error removing favorite lesson:", error);
            Toast.show("Có lỗi xảy ra khi xóa bài học khỏi yêu thích", {
                placement: "bottom",
                type: "error"
            });
        }
    };

    const navigateToLesson = (item: LessonWishlistType) => {
        if (!item.details) return;
        
        // Gửi người dùng đến khóa học với tham số bài học cụ thể
        router.push({
            pathname: "/(routes)/course-access",
            params: { 
                courseId: item.courseId,
                courseData: JSON.stringify({
                    _id: item.courseId,
                    name: item.details?.course.name || "",
                    thumbnail: item.details?.course.thumbnail || {}
                }),
                lessonId: item.lessonId
            },
        });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        
        // Nếu chuyển sang tab bài học, đảm bảo dữ liệu được tải
        if (tab === 'lessons' && favoriteLesson.length === 0) {
            console.log("Tab changed to lessons, fetching lesson data...");
            fetchFavoriteLessons();
        }
    };

    let [fontsLoaded, fontsError] = useFonts({
        Raleway_600SemiBold,
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_700Bold,
        Nunito_600SemiBold,
    });

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    return (
        <>
            { loading ? (
                <Loader />
            ):(
                <View style={styles.container}>
                    <View style={styles.circle1}></View>
                    <View style={styles.circle2}></View>
                    <View style={styles.circle3}></View>

                    {/* Tab buttons - Đã cải tiến */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            style={[
                                styles.tabButton, 
                                activeTab === 'courses' && styles.activeTabButton
                            ]}
                            onPress={() => {
                                console.log("Tab Khóa học được nhấn");
                                Toast.show("Đang chuyển sang tab Khóa học", {
                                    placement: "bottom",
                                    type: "normal",
                                    duration: 2000
                                });
                                setActiveTab('courses');
                            }}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === 'courses' && styles.activeTabText
                            ]}>
                                Khóa học ({filteredCourses.length})
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            style={[
                                styles.tabButton, 
                                activeTab === 'lessons' && styles.activeTabButton
                            ]}
                            onPress={() => {
                                console.log("Tab Bài học được nhấn");
                                Toast.show("Đang chuyển sang tab Bài học", {
                                    placement: "bottom",
                                    type: "normal",
                                    duration: 2000
                                });
                                setActiveTab('lessons');
                                fetchFavoriteLessons();
                            }}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === 'lessons' && styles.activeTabText
                            ]}>
                                Bài học ({favoriteLesson.length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats summary for courses tab */}
                    {activeTab === 'courses' && filteredCourses.length > 0 && (
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{filteredCourses.length}</Text>
                                <Text style={styles.statLabel}>Khóa học</Text>
                            </View>
                            <View style={styles.statSeparator} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{totalLessons}</Text>
                                <Text style={styles.statLabel}>Bài học</Text>
                            </View>
                        </View>
                    )}
                    
                    <ScrollView 
                        style={{
                            marginTop: 10, 
                            flex: 1, 
                            marginHorizontal: 'auto', 
                            position: 'relative', 
                            zIndex: 99
                        }} 
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={onRefresh}
                                colors={['#2467EC']}
                                tintColor="#2467EC"
                            />
                        }
                    >
                        {/* Course tab content */}
                        {activeTab === 'courses' && (
                            <>
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map(course => (
                                        <View style={{width: wp(90), marginTop: 10, marginBottom: 10}} key={course._id}>
                                            <CourseCard item={course} isHorizontal={true}/>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Chưa có khóa học nào được yêu thích</Text>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Lessons tab content */}
                        {activeTab === 'lessons' && (
                            <>
                                {favoriteLesson.length > 0 ? (
                                    favoriteLesson.map((item) => (
                                        <View key={item._id} style={styles.lessonCard}>
                                            <TouchableOpacity 
                                                style={styles.lessonContentWrapper}
                                                onPress={() => navigateToLesson(item)}
                                            >
                                                <View style={styles.lessonContent}>
                                                    <View style={styles.lessonImageContainer}>
                                                        <Image 
                                                            source={{ 
                                                                uri: item.details?.course.thumbnail.url 
                                                                    ? `${URL_IMAGES}/${item.details.course.thumbnail.url}` 
                                                                    : "/avatar.png" 
                                                            }} 
                                                            style={styles.lessonImage} 
                                                            resizeMode="cover"
                                                            defaultSource={require('@/assets/images/placeholder.png')}
                                                        />
                                                    </View>
                                                    <View style={styles.lessonInfo}>
                                                        <View style={styles.courseNameContainer}>
                                                            <Text style={styles.courseName} numberOfLines={1}>
                                                                {item.details?.course.name || "Khóa học không xác định"}
                                                            </Text>
                                                        </View>
                                                        
                                                        <Text style={styles.lessonTitle} numberOfLines={2}>
                                                            {item.details?.lesson.title || "Bài học không xác định"}
                                                        </Text>
                                                        
                                                        <View style={styles.sectionContainer}>
                                                            <Text style={styles.sectionLabel}>Phần: </Text>
                                                            <Text style={styles.sectionName} numberOfLines={1}>
                                                                {item.details?.lesson.videoSection || "Phần không tên"}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.actionBar}>
                                                <TouchableOpacity 
                                                    style={styles.watchButton}
                                                    onPress={() => navigateToLesson(item)}
                                                >
                                                    <Feather name="eye" size={14} color="#fff" style={{marginRight: 5}} />
                                                    <Text style={styles.watchButtonText}>Xem bài học</Text>
                                                </TouchableOpacity>
                                                
                                                <TouchableOpacity 
                                                    style={styles.removeButton}
                                                    onPress={() => {
                                                        console.log("Đang xóa bài học yêu thích:", item._id);
                                                        handleRemoveFavoriteLesson(item);
                                                    }}
                                                >
                                                    <Feather name="trash-2" size={14} color="#E55252" style={{marginRight: 5}} />
                                                    <Text style={styles.removeButtonText}>Xóa</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Chưa có bài học nào được yêu thích</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'relative', 
        height: 600, 
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    titleContainer: {
        width: wp(90),
        marginHorizontal: 'auto',
        marginTop: 10,
        marginBottom: 20
    },
    titleText:{
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E8ECF4',
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
        overflow: 'hidden',
        zIndex: 100
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabButton: {
        backgroundColor: '#2467EC',
    },
    tabText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderRadius: 10,
        zIndex: 10,
        position: 'relative'
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    statNumber: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: '#2467EC',
    },
    statLabel: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
        color: '#757575',
        marginTop: 2,
    },
    statSeparator: {
        height: 30,
        width: 1,
        backgroundColor: '#e0e0e0',
    },
    circle1: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 0, 255, 0.05)',
        position: 'absolute',
        top: -20,
        right: 80,
        zIndex: 1
    },
    circle2: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 128, 0, 0.07)',
        position: 'absolute',
        top: 20,
        right: 130,
        zIndex: 2
    },
    circle3: {
        width: 200,
        height: 200,
        borderRadius: 200,
        backgroundColor: 'rgba(135, 206, 235, 0.1)', 
        position: 'absolute',
        top: 30,
        right: -30, 
        zIndex: 6
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#666'
    },
    lessonCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        padding: 12,
        width: 456,
        height: 200
    },
    lessonContentWrapper: {
        flex: 1,
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    lessonImage: {
        width: '100%',
        height: '100%',
    },
    lessonInfo: {
        flex: 1,
        marginLeft: 12,
    },
    courseNameContainer: {
        backgroundColor: '#E8F0FE',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    courseName: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 12,
        color: '#2467EC',
    },
    lessonTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 15,
        color: '#333',
        marginBottom: 10,
    },
    sectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionLabel: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 12,
        color: '#666',
        marginRight: 2,
        
    },
    sectionName: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 12,
        color: '#666',
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    watchButton: {
        backgroundColor: '#2467EC',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    watchButtonText: {
        color: '#fff',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 13,
    },
    removeButton: {
        backgroundColor: '#FFE0E0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#E55252',
        fontFamily: 'Nunito_500Medium',
        fontSize: 13,
    }
});

export default WishListScreen;