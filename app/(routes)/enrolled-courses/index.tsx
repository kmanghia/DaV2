import CourseCard from "@/components/cards/course.card";
import CourseProgress from "@/components/cards/course.progress";
import Loader from "@/components/loader";
import useUser from "@/hooks/useUser";
import { URL_SERVER } from "@/utils/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, SafeAreaView, Image } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import * as Progress from "react-native-progress";
import React from "react";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useSelector, useDispatch } from "react-redux";
import { AntDesign, Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as userActions from '../../../utils/store/actions/user.actions';

const EnrolledCoursesScreen = () => {
    const [loader, setLoader] = useState(false);
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const { loading } = useUser();
    const progresses = useSelector((state: any) => state.user.progress);
    const dispatch = useDispatch();
    
    // Log dữ liệu progresses để debug
    console.log('Progress data:', JSON.stringify(progresses, null, 2));
    
    useFocusEffect(
        useCallback(() => {
            loadEnrolledCourses();
        }, [])
    );
    
    const loadEnrolledCourses = async () => {
        try {
            setLoader(true);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            // Lấy danh sách khóa học đã đăng ký và tiến độ học tập
            const response = await axios.get(`${URL_SERVER}/user/progress`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            if (response.data.response && response.data.response.progress) {
                const progressData = response.data.response.progress;
                
                // Lấy thông tin chi tiết của các khóa học
                const courseIds = progressData.map((item: any) => item.courseId);
                
                if (courseIds.length > 0) {
                    const coursesResponse = await axios.get(`${URL_SERVER}/get-courses`);
                    
                    if (coursesResponse.data && coursesResponse.data.courses) {
                        const allCourses = coursesResponse.data.courses;
                        
                        // Lọc ra chỉ các khóa học đã đăng ký
                        const enrolledCourses = allCourses.filter((course: any) => 
                            courseIds.includes(course._id)
                        );
                        
                        setCoursesData(enrolledCourses);
                        
                        // Cập nhật Redux store với thông tin đầy đủ
                        const updatedProgress = progressData.map((progress: any) => {
                            const course = enrolledCourses.find((c: any) => c._id === progress.courseId);
                            let completedChapters = 0;
                            progress.chapters.forEach((chapter: any) => {
                                if (chapter.isCompleted) completedChapters++;
                            });
                            
                            return {
                                courseId: progress.courseId,
                                progress: completedChapters / progress.chapters.length,
                                name: course ? course.name : 'Khóa học',
                                total: progress.chapters.length
                            };
                        });
                        
                        dispatch(userActions.saveProgressOfUser(updatedProgress));
                    }
                }
            }
            
            setLoader(false);
        } catch (error) {
            console.error('Error loading enrolled courses:', error);
            setLoader(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
            
           
            
            {loader || loading ? (
                <Loader />
            ) : (
                <>
                    {/* Dashboard Summary */}
                    <View style={styles.dashboardContainer}>
                        <LinearGradient
                            colors={['#0984E3', '#2980B9']}
                            style={styles.dashboardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.dashboardContent}>
                                <View style={styles.dashboardInfo}>
                                    <Text style={styles.dashboardTitle}>Tổng quan khóa học</Text>
                                    <Text style={styles.dashboardSubtitle}>Theo dõi tiến độ học tập của bạn</Text>
                                    
                                    <View style={styles.statsContainer}>
                                        <View style={styles.statItem}>
                                            <View style={styles.statIconContainer}>
                                                <FontAwesome5 name="book-open" size={16} color="#0984E3" />
                                            </View>
                                            <View>
                                                <Text style={styles.statNumber}>{progresses.length}</Text>
                                                <Text style={styles.statLabel}>Khóa học</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.statDivider} />
                                        
                                        <View style={styles.statItem}>
                                            <View style={styles.statIconContainer}>
                                                <MaterialCommunityIcons name="certificate" size={16} color="#0984E3" />
                                            </View>
                                            <View>
                                                <Text style={styles.statNumber}>
                                                    {progresses.filter((course: any) => course.progress === 1).length}
                                                </Text>
                                                <Text style={styles.statLabel}>Hoàn thành</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                    
                    {/* Course List */}
                    <View style={styles.coursesContainer}>
                        <Text style={styles.sectionTitle}>
                            {progresses.length > 0 ? 'Danh sách khóa học' : 'Chưa có khóa học nào'}
                        </Text>
                        
                        <ScrollView 
                            style={styles.coursesList}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.coursesListContent}
                        >
                            {progresses.length > 0 ? 
                                progresses.map((progress: any, index: number) => (
                                    <View key={`${index}-course`} style={styles.courseItem}>
                                        <CourseProgress progress={progress}/>
                                    </View>
                                ))
                                :
                                <View style={styles.emptyContainer}>
                                    <Feather name="book" size={60} color="#B2BEC3" />
                                    <Text style={styles.emptyText}>Bạn chưa đăng ký khóa học nào</Text>
                                    <TouchableOpacity 
                                        style={styles.exploreCourseButton}
                                        onPress={() => router.push("/")}
                                    >
                                        <Text style={styles.exploreCourseButtonText}>Khám phá khóa học</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        </ScrollView>
                    </View>
                </>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    dashboardContainer: {
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#0984E3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dashboardGradient: {
        padding: 20,
    },
    dashboardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashboardInfo: {
        flex: 1,
    },
    dashboardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    dashboardSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 10,
    },
    coursesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 16,
    },
    coursesList: {
        flex: 1,
    },
    coursesListContent: {
        paddingBottom: 20,
    },
    courseItem: {
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#757575',
        marginTop: 16,
        marginBottom: 24,
    },
    exploreCourseButton: {
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    exploreCourseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
})

export default EnrolledCoursesScreen;