import ReviewCard from "@/components/cards/review.card";
import CourseLesson from "@/components/course-lesson";
import Loader from "@/components/loader";
import useUser from "@/hooks/useUser";
import { URL_SERVER, URL_VIDEO, URL_VIDEOS } from "@/utils/url";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { FontAwesome, Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useFonts } from "expo-font";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Image, ScrollView, Text, TouchableOpacity, View, SafeAreaView,
    StyleSheet,
    Alert,
    Animated,
    Dimensions,
    ActivityIndicator
} from "react-native"
import { Colors } from 'react-native/Libraries/NewAppScreen';
import app from "../../../package.json";
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { widthPercentageToDP } from "react-native-responsive-screen";

const { width } = Dimensions.get('window');

const CourseDetailsScreen = () => {

    const videoRef = useRef<Video>(null);  
    const scrollY = useRef(new Animated.Value(0)).current;

    const [activeButton, setActiveButton] = useState("About");
    const { user, loading } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);
    const { item } = useLocalSearchParams();
    const [courseData, setCourseData] = useState<CoursesType>(item ? JSON.parse(item as string) : null);
    const [courseInfo, setCourseInfo] = useState<CoursesType>();
    const [checkPurchased, setCheckPurchased] = useState(false);
    const [videoData, setVideoData] = useState("");
    const [token, setToken] = useState({
        access: "",
        refresh: ""
    });
    const [showAllReviews, setShowAllReviews] = useState(false);

    useEffect(() => {
        if (user?.courses.find((i: any) => i._id === courseData._id)) {
            setCheckPurchased(true);
        }
    }, [user])

    const LoadCourse = async () => {
        let paymented: { _id: string }[] = [];
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            let data = await AsyncStorage.getItem("paymented");
            if (data) {
                paymented = JSON.parse(data);
            }
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            const _data: CoursesType = response.data?.courses?.filter((item: any) => item._id === courseData._id)[0];
            if(_data){
                setCourseData(_data);
                axios.get(`${URL_VIDEO}/api/files/${_data.demoUrl}`, {
                    headers: {
                        'access-token': accessToken,
                        'refresh-token': refreshToken
                    }
                })
                    .then((result) => {
                        setToken({
                            access: accessToken ?? '',
                            refresh: refreshToken ?? ''
                        })
                        setVideoData(result.data.url);
                    })
            }
            const isPaymentedCourse = paymented.some((item) => item._id === _data._id);
            const isUserCourse = user?.courses.some((item: any) => item._id === _data._id);
            if (isPaymentedCourse || isUserCourse) {
                setCheckPurchased(true);
            }
            setCourseInfo(_data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        LoadCourse();
    }, [])

    useFocusEffect(
        useCallback(() => {
            LoadCourse();
        }, [])
    )

    const OnHandleAddToCart = async () => {
        try {
            const existingCartData = await AsyncStorage.getItem("cart");
            const cartData = existingCartData !== null ? JSON.parse(existingCartData) : [];
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            let itemExists = cartData.some((item: any) => item._id === courseData._id);

            if (!itemExists) {
                cartData.unshift(courseData)
                await AsyncStorage.setItem("cart", JSON.stringify(cartData));
                await axios.put(`${URL_SERVER}/add-course`, courseData, {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                });
            }
            router.push("/(routes)/cart");
        } catch (error: any) {
            console.log(error.message);
        }
    }

    let [fontsLoaded, fontError] = useFonts({
        Raleway_600SemiBold,
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_700Bold,
        Nunito_600SemiBold,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    // Calculate discount percentage
    const discountPercentage = courseData?.estimatedPrice ? 
        Math.round(100 - (courseData.price / courseData.estimatedPrice * 100)) : 0;

    // Add a function to calculate total course length
    const calculateTotalDuration = () => {
        const courseItems = (courseData as any)?.courseData || [];
        if (!Array.isArray(courseItems)) {
            return { hours: 0, minutes: 0 };
        }
        
        // Calculate total seconds
        const totalSeconds = courseItems.reduce((total: number, item: any) => {
            const videoLength = item.videoLength || 0;
            return total + videoLength;
        }, 0);
        
        // Convert to hours and minutes
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        return { hours, minutes };
    };

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <View style={styles.container}>
                    <Animated.ScrollView 
                        showsVerticalScrollIndicator={false} 
                        style={styles.scrollView}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                    >
                        {/* Video Section */}
                        <View style={styles.videoSection}>
                            <View style={styles.videoContainer}>
                                <TouchableOpacity 
                                    style={styles.backButton}
                                    onPress={() => router.back()}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>
                                
                                <View style={styles.ratingBadge}>
                                    <FontAwesome name="star" size={14} color="#FFB800" />
                                    <Text style={styles.ratingText}>
                                        {courseData?.ratings?.toFixed(1)}
                                    </Text>
                                </View>
                                
                                {videoData ? (
                                    <Video 
                                        ref={videoRef}
                                        source={{
                                            uri: videoData.startsWith('http') ? videoData : `${URL_VIDEO}${videoData}`,
                                            headers: {
                                                'access-token': token.access,
                                                'refresh-token': token.refresh
                                            }
                                        }}
                                        style={styles.video}
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        onError={(error) => console.log('Video Error:', error)}
                                        shouldPlay={false}
                                        isLooping={false}
                                        isMuted={false}
                                    />
                                ) : (
                                    <View style={styles.videoPlaceholder}>
                                        <ActivityIndicator size="large" color="#0070e0" />
                                        <Text style={styles.loadingText}>Loading video...</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Course Info Card */}
                        <View style={styles.courseInfoCard}>
                            {/* Course Title */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.courseTitle}>{courseData?.name}</Text>
                            </View>
                            
                            {/* Price Info */}
                            <View style={styles.priceContainer}>
                                <View style={styles.priceWrapper}>
                                    <Text style={styles.currentPrice}>
                                            {courseData?.price?.toLocaleString()}đ
                                        </Text>
                                    <Text style={styles.originalPrice}>
                                            {courseData?.estimatedPrice?.toLocaleString()}đ
                                        </Text>
                                    {discountPercentage > 0 && (
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>-{discountPercentage}%</Text>
                                    </View>
                                    )}
                                </View>
                                <View style={styles.studentContainer}>
                                    <Ionicons name="people" size={18} color="#666" />
                                    <Text style={styles.studentCount}>
                                        {courseData?.purchased} học viên
                                </Text>
                                </View>
                            </View>

                            {/* Tab Navigation */}
                            <View style={styles.tabContainer}>
                                {['About', 'Lessons', 'Reviews'].map((tab) => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.tabButton,
                                            activeButton === tab && styles.activeTabButton
                                        ]}
                                        onPress={() => setActiveButton(tab)}
                                    >
                                        <View style={styles.tabContent}>
                                            <Animated.View 
                                                style={[
                                                    styles.tabIconContainer,
                                                    { 
                                                        opacity: activeButton === tab ? 1 : 0.6,
                                                        transform: [{ 
                                                            scale: activeButton === tab ? 1.1 : 1 
                                                        }]
                                                    }
                                                ]}
                                            >
                                                {tab === 'About' ? (
                                                    <Ionicons name="information-circle-outline" size={20} color={activeButton === tab ? '#0070e0' : '#666'} />
                                                ) : tab === 'Lessons' ? (
                                                    <Ionicons name="book-outline" size={20} color={activeButton === tab ? '#0070e0' : '#666'} />
                                                ) : (
                                                    <Ionicons name="star-outline" size={20} color={activeButton === tab ? '#0070e0' : '#666'} />
                                                )}
                                            </Animated.View>
                                            <Text 
                                                style={[
                                                    styles.tabButtonText,
                                                    activeButton === tab && styles.activeTabText
                                                ]}
                                            >
                                                {tab === 'About' ? 'Thông tin' : 
                                                 tab === 'Lessons' ? 'Bài giảng' : 'Nhận xét'}
                                            </Text>
                                            {activeButton === tab && (
                                                <View style={styles.activeTabIndicator} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Tab Content */}
                            {activeButton === "About" && (
                                <View style={styles.aboutContainer}>
                                    {/* Course Description */}
                                    <View style={styles.infoSection}>
                                        <View style={styles.sectionTitleContainer}>
                                            <Ionicons name="information-circle" size={22} color="#0070e0" />
                                            <Text style={styles.sectionTitle}>
                                        Thông tin khóa học
                                    </Text>
                                        </View>
                                        <View style={styles.infoCard}>
                                            <View style={styles.courseDuration}>
                                                <Ionicons name="time-outline" size={16} color="#666" />
                                                <Text style={styles.courseDurationText}>
                                                    Thời lượng: {(() => {
                                                    const totalMinutes = (courseData as any)?.courseData?.reduce((total: number, item: any) => total + (item.videoLength || 0), 0);
                                                    if (totalMinutes > 60) {
                                                        const hours = Math.floor(totalMinutes / 60);
                                                        const minutes = totalMinutes % 60;
                                                        return `${hours} giờ ${minutes} phút`;
                                                    }
                                                    return `${totalMinutes} phút`;
                                                })()}
                                                </Text>
                                            </View>
                                            <Text style={styles.descriptionText}>
                                        {isExpanded
                                            ? courseData?.description
                                                    : courseData?.description?.slice(0, 302)}
                                    </Text>
                                            {courseData?.description?.length > 302 && (
                                        <TouchableOpacity
                                                    style={styles.showMoreButton}
                                            onPress={() => setIsExpanded(!isExpanded)}
                                        >
                                                    <Text style={styles.showMoreText}>
                                                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                                                    </Text>
                                                    <Ionicons 
                                                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                                                        size={16} 
                                                        color="#0070e0" 
                                                        style={{marginLeft: 4}} 
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    {/* What you'll learn */}
                                    <View style={styles.infoSection}>
                                        <View style={styles.sectionTitleContainer}>
                                            <Ionicons name="school" size={22} color="#0070e0" />
                                            <Text style={styles.sectionTitle}>
                                                Bạn sẽ học được gì
                                            </Text>
                                        </View>
                                        <View style={styles.infoCard}>
                                            <View style={styles.learnItemsGrid}>
                                                {courseData?.benefits?.map((item: BenefitType, index: number) => (
                                                    <View key={index} style={styles.learnItem}>
                                                        <View style={styles.checkIconContainer}>
                                                            <Ionicons name="checkmark-sharp" size={14} color="#fff" />
                                                        </View>
                                                        <Text style={styles.learnItemText}>
                                                            {item.title}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {/* Requirements */}
                                    <View style={styles.infoSection}>
                                        <View style={styles.sectionTitleContainer}>
                                            <Ionicons name="list" size={22} color="#0070e0" />
                                            <Text style={styles.sectionTitle}>
                                                Yêu cầu khóa học
                                            </Text>
                                        </View>
                                        <View style={styles.infoCard}>
                                            {courseData?.prerequisites?.map((item: PrerequisiteType, index: number) => (
                                                <View key={index} style={styles.requirementItem}>
                                                    <View style={styles.bulletPoint} />
                                                    <Text style={styles.requirementText}>
                                                        {item.title}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                    
                                    {/* Instructor */}
                                    {/* <View style={styles.infoSection}>
                                        <View style={styles.sectionTitleContainer}>
                                            <Ionicons name="person" size={22} color="#0070e0" />
                                            <Text style={styles.sectionTitle}>
                                                Giảng viên
                                            </Text>
                                        </View>
                                        <View style={styles.instructorCard}>
                                            <View style={styles.instructorHeader}>
                                                <View style={styles.instructorAvatar}>
                                                    <Text style={styles.instructorInitial}>
                                                        G
                                                    </Text>
                                                </View>
                                                <View style={styles.instructorInfo}>
                                                    <Text style={styles.instructorName}>
                                                        Giảng viên khóa học
                                                    </Text>
                                                    <Text style={styles.instructorRole}>
                                                        Chuyên gia giảng dạy
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View> */}
                                </View>
                            )}

                            {activeButton === "Lessons" && (
                                <View style={styles.lessonsContainer}>
                                    <View style={styles.lessonHeader}>
                                        <Text style={styles.lessonHeaderTitle}>Nội dung khóa học</Text>
                                        <View style={styles.lessonStats}>
                                            <View style={styles.lessonStatItem}>
                                                <Ionicons name="time-outline" size={16} color="#666" />
                                                <Text style={styles.lessonStatText}>
                                                {(() => {
                                                    const totalMinutes = (courseData as any)?.courseData?.reduce((total: number, item: any) => total + (item.videoLength || 0), 0);
                                                    if (totalMinutes > 60) {
                                                        const hours = Math.floor(totalMinutes / 60);
                                                        const minutes = totalMinutes % 60;
                                                        return `${hours} giờ ${minutes} phút`;
                                                    }
                                                    return `${totalMinutes} phút`;
                                                })()}
                                                </Text>
                                            </View>
                                            <View style={styles.lessonStatItem}>
                                                <Ionicons name="document-text-outline" size={16} color="#666" />
                                                <Text style={styles.lessonStatText}>
                                                    {(courseData as any)?.courseData?.length || 0} bài giảng
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <CourseLesson key={"number-1"} courseDetails={courseData} />
                                </View>
                            )}

                            {activeButton === "Reviews" && (
                                <View style={styles.reviewsContainer}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewHeaderTitle}>Đánh giá từ học viên</Text>
                                        <View style={styles.overallRating}>
                                            <Text style={styles.ratingNumber}>{courseData?.ratings?.toFixed(1) || "0.0"}</Text>
                                            <View style={styles.starsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <FontAwesome 
                                                        key={star} 
                                                        name={star <= Math.round(courseData?.ratings || 0) ? "star" : "star-o"} 
                                                        size={16} 
                                                        color="#FFB800" 
                                                        style={{marginHorizontal: 2}}
                                                    />
                                                ))}
                                                <Text style={styles.totalReviews}>
                                                    ({courseInfo?.reviews?.length || 0} đánh giá)
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {courseInfo?.reviews && courseInfo.reviews.length > 0 ? (
                                        <View style={styles.reviewsList}>
                                            {(showAllReviews ? courseInfo.reviews : courseInfo.reviews.slice(0, 5)).map((item: ReviewType, index: number) => (
                                                <View key={`${index}-baa`} style={styles.reviewCard}>
                                                    <ReviewCard item={item} key={`${index}-gagagw`}/>
                                                </View>
                                            ))}
                                            
                                            {!showAllReviews && courseInfo.reviews.length > 5 && (
                                                <TouchableOpacity 
                                                    style={styles.seeAllButton}
                                                    onPress={() => setShowAllReviews(true)}
                                                >
                                                    <Text style={styles.seeAllButtonText}>Xem tất cả đánh giá</Text>
                                                    <Ionicons name="chevron-down" size={18} color="#0070e0" />
                                                </TouchableOpacity>
                                            )}
                                            
                                            {showAllReviews && courseInfo.reviews.length > 5 && (
                                                <TouchableOpacity 
                                                    style={styles.seeAllButton}
                                                    onPress={() => setShowAllReviews(false)}
                                                >
                                                    <Text style={styles.seeAllButtonText}>Thu gọn</Text>
                                                    <Ionicons name="chevron-up" size={18} color="#0070e0" />
                                                </TouchableOpacity>
                                        )}
                                    </View>
                                    ) : (
                                        <View style={styles.emptyReviews}>
                                            <MaterialIcons name="rate-review" size={60} color="#eee" />
                                            <Text style={styles.emptyReviewsText}>
                                                Chưa có đánh giá nào cho khóa học này
                                            </Text>
                                            <Text style={styles.emptyReviewsSubtext}>
                                                Hãy trở thành người đầu tiên đánh giá!
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </Animated.ScrollView>

                    {/* Action Button */}
                    <View style={styles.actionButtonContainer}>
                        {checkPurchased ? (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push({
                                    pathname: "/(routes)/course-access",
                                    params: { courseData: JSON.stringify(courseData), courseId: courseData._id }
                                })}
                            >
                                <Text style={styles.actionButtonText}>
                                    Xem khóa học
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => OnHandleAddToCart()}
                            >
                                <Text style={styles.actionButtonText}>
                                    Thêm vào giỏ hàng
                                </Text>
                                <Ionicons name="cart" size={20} color="#fff" style={styles.buttonIcon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    videoSection: {
        width: '100%',
        height: 250,
        marginBottom: 20,
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    ratingText: {
        color: 'white',
        marginLeft: 5,
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
    },
    courseInfoCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 0,
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    titleContainer: {
        marginBottom: 15,
    },
    courseTitle: {
        fontSize: 24,
        fontFamily: 'Raleway_700Bold',
        color: '#222',
        lineHeight: 32,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    priceWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentPrice: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: '#0070e0',
    },
    originalPrice: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: '#9e9e9e',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    discountBadge: {
        backgroundColor: '#ff3d71',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    discountText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },
    studentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentCount: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
        fontFamily: 'Nunito_500Medium',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
    },
    tabIconContainer: {
        marginBottom: 8,
    },
    activeTabButton: {
        backgroundColor: 'transparent',
    },
    tabButtonText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#0070e0',
        fontFamily: 'Nunito_700Bold',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: -15,
        width: '60%',
        height: 3,
        backgroundColor: '#0070e0',
        borderRadius: 3,
    },
    aboutContainer: {
        paddingVertical: 5,
    },
    infoSection: {
        marginBottom: 25,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#222',
        marginLeft: 8,
    },
    infoCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    descriptionText: {
        fontSize: 15,
        fontFamily: 'Nunito_500Medium',
        color: '#444',
        lineHeight: 24,
        textAlign: 'justify',
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingVertical: 5,
    },
    showMoreText: {
        color: '#0070e0',
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
    },
    learnItemsGrid: {
        flexDirection: 'column',
    },
    learnItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    checkIconContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#00b383',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    learnItemText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito_500Medium',
        color: '#444',
        lineHeight: 22,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bulletPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0070e0',
        marginRight: 12,
        marginTop: 8,
    },
    requirementText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito_500Medium',
        color: '#444',
        lineHeight: 22,
    },
    instructorCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    instructorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0070e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    instructorInitial: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'Nunito_700Bold',
    },
    instructorInfo: {
        flex: 1,
    },
    instructorName: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#222',
        marginBottom: 4,
    },
    instructorRole: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
        color: '#666',
    },
    lessonsContainer: {
        paddingVertical: 10,
    },
    lessonHeader: {
        marginBottom: 20,
    },
    lessonHeaderTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#222',
        marginBottom: 10,
    },
    lessonStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    lessonStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    lessonStatText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
        fontFamily: 'Nunito_500Medium',
    },
    reviewsContainer: {
        paddingVertical: 10,
    },
    reviewHeader: {
        marginBottom: 20,
    },
    reviewHeaderTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#222',
        marginBottom: 15,
    },
    overallRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
    },
    ratingNumber: {
        fontSize: 22,
        fontFamily: 'Nunito_700Bold',
        color: '#0070e0',
        marginRight: 15,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalReviews: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        fontFamily: 'Nunito_400Regular',
    },
    reviewsList: {
        marginTop: 5,
    },
    reviewCard: {
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    emptyReviews: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginTop: 15,
    },
    emptyReviewsText: {
        marginTop: 15,
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#666',
    },
    emptyReviewsSubtext: {
        marginTop: 5,
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#888',
    },
    actionButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    actionButton: {
        backgroundColor: '#0070e0',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
    },
    buttonIcon: {
        marginLeft: 8,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f7ff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 15,
        marginBottom: 10,
    },
    seeAllButtonText: {
        color: '#0070e0',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        marginRight: 5,
    },
    courseDuration: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f0f7ff',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    courseDurationText: {
        marginLeft: 6,
        color: '#0070e0',
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
    },
});

export default CourseDetailsScreen;