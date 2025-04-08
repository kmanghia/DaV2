import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader";
import { URL_SERVER } from "@/utils/url";
import { Nunito_400Regular, Nunito_700Bold, Nunito_500Medium, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Zocial } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFonts } from "expo-font";
import React from "react";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, SafeAreaView, StyleSheet, Dimensions } from "react-native"
import {
    widthPercentageToDP as wp
} from "react-native-responsive-screen"
import { useSelector } from "react-redux";

const { width } = Dimensions.get('window');

const CoursesScreen = () => {
    const [courses, setCourses] = useState<CoursesType[]>([]);
    const [originalCourses, setOriginalCourses] = useState<CoursesType[]>([]);
    const [loading, setLoading] = useState(true);
    const [progresses, setProgresses] = useState<Progress[]>([]);
    const [activeTab, setActiveTab] = useState("Incomplete");
    const reduxProgresses = useSelector((state: any) => state.user.progress);
    
    useEffect(() => {
        fetchCourses();
        loadProgressOfUser();
    }, []);

    useEffect(() => {
        if (originalCourses.length > 0) {
            filterCoursesByCompletion();
        }
    }, [originalCourses, progresses, activeTab, reduxProgresses]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setOriginalCourses(response.data.courses);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

    const loadProgressOfUser = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.get(`${URL_SERVER}/user/progress`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            let _processes: Progress[] = [];
            if(response.data.response && response.data.response.progress){
                let _ = response.data.response.progress;
                _processes = _.map((progress: Progress) => ({
                    courseId: progress.courseId,
                    chapters: progress.chapters.map((chapter: Chapter) => ({
                        chapterId: chapter.chapterId,
                        isCompleted: chapter.isCompleted
                    }))
                }));
            }
            setProgresses(_processes);
        } catch (error) {
            console.log(error);
        }
    }

    const isCourseCompleted = (courseId: string) => {
        // First check in Redux store which has calculated percentages
        const reduxProgress = reduxProgresses.find(
            (p: any) => p.courseId === courseId
        );
        
        if (reduxProgress) {
            return reduxProgress.progress === 1; // 1 means 100%
        }
        
        // Fallback to manual calculation using progress data
        const courseProgress = progresses.find(progress => progress.courseId === courseId);
        if (!courseProgress || courseProgress.chapters.length === 0) return false;
        
        const totalChapters = courseProgress.chapters.length;
        const completedChapters = courseProgress.chapters.filter(
            chapter => chapter.isCompleted
        ).length;
        
        return completedChapters === totalChapters;
    };
    
    const hasCourseProgress = (courseId: string) => {
        return reduxProgresses.some((p: any) => p.courseId === courseId) || 
               progresses.some(p => p.courseId === courseId);
    };

    const filterCoursesByCompletion = () => {
        // First filter courses that have any progress (purchased courses)
        const coursesWithProgress = originalCourses.filter(course => 
            hasCourseProgress(course._id)
        );
        
        // Then filter by completion status based on active tab
        if (activeTab === "Complete") {
            setCourses(coursesWithProgress.filter(course => 
                isCourseCompleted(course._id)
            ));
        } else {
            setCourses(coursesWithProgress.filter(course => 
                !isCourseCompleted(course._id)
            ));
        }
    };

    let [fontsLoaded, fontsError] = useFonts({
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_700Bold,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Raleway_600SemiBold,
    });

    if (!fontsLoaded && !fontsError) {
        return null;
    }
    
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    }

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <Loader />
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tabButton, 
                                activeTab === "Incomplete" && styles.activeTab
                            ]}
                            onPress={() => handleTabChange("Incomplete")}
                        >
                            <Text style={[
                                styles.tabText, 
                                activeTab === "Incomplete" && styles.activeTabText
                            ]}>
                                Đang học
                            </Text>
                            {activeTab === "Incomplete" && <View style={styles.indicator} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabButton, 
                                activeTab === "Complete" && styles.activeTab
                            ]}
                            onPress={() => handleTabChange("Complete")}
                        >
                            <Text style={[
                                styles.tabText, 
                                activeTab === "Complete" && styles.activeTabText
                            ]}>
                                Đã hoàn thành
                            </Text>
                            {activeTab === "Complete" && <View style={styles.indicator} />}
                        </TouchableOpacity>
                    </View>
                    
                    {/* Course stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{courses.length}</Text>
                            <Text style={styles.statLabel}>Khóa học</Text>
                        </View>
                        <View style={styles.statSeparator} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {courses.reduce((total, course) => total + course.courseData.length, 0)}
                            </Text>
                            <Text style={styles.statLabel}>Bài học</Text>
                        </View>
                    </View>
                    
                    {/* Course list */}
                    {courses.length > 0 ? (
                        <ScrollView
                            style={styles.courseList}
                            showsVerticalScrollIndicator={false}
                        >
                            {courses.map((item: CoursesType, index: number) => (
                                <View key={`course-${item._id}-${index}`} style={styles.courseItem}>
                                    <CourseCard item={item} isHorizontal={true} />
                                </View>
                            ))}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.iconContainer}>
                                <Zocial name="cloudapp" size={60} style={{ color: "#ccc" }} />
                            </View>
                            <Text style={styles.emptyText}>
                                {activeTab === "Complete" 
                                    ? "Bạn chưa hoàn thành khóa học nào" 
                                    : "Bạn đã hoàn thành tất cả các khóa học"}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8'
    },
    tabContainer: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 5,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        marginBottom: 10,
        justifyContent: 'space-around',
        paddingHorizontal: 15
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        position: 'relative',
        alignItems: 'center',
        minWidth: width / 2.8,
    },
    activeTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#757575',
    },
    activeTabText: {
        color: '#2467EC',
        fontFamily: 'Nunito_700Bold',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 2,
        width: '60%',
        backgroundColor: '#2467EC',
        borderRadius: 10,
    },
    statsContainer: {
        
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        borderRadius: 8,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statNumber: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#2467EC',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Nunito_500Medium',
        color: '#757575',
        marginTop: 2,
    },
    statSeparator: {
        height: 25,
        width: 1,
        backgroundColor: '#e0e0e0',
    },
    courseList: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 2,
    },
    courseItem: {
   
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        marginBottom: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#757575',
        fontFamily: 'Nunito_500Medium',
        lineHeight: 20,
    }
});

export default CoursesScreen;