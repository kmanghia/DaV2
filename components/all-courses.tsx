import { URL_SERVER } from "@/utils/url";
import { Nunito_500Medium, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import axios from "axios";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View, FlatList, StyleSheet } from "react-native";
import CourseCard from "./cards/course.card";
import { Zocial } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import * as userActions from "../utils/store/actions/user.actions";

interface AllCoursesProps {
    displayMode?: "vertical" | "horizontal";
    category?: "featured" | "new" | "popular" | "all";
    limit?: number;
    hideViewAll?: boolean;
}

const AllCourses = ({ 
    displayMode = "vertical", 
    category = "all", 
    limit = 10,
    hideViewAll = false
}: AllCoursesProps) => {
    const navigation = useNavigation();
    const [courses, setCourses] = useState<CoursesType[]>([]);
    const [progresses, setProgresses] = useState<Progress[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CoursesType[]>([]);
    const dispatch = useDispatch();
    
    useFocusEffect(
        useCallback(() => {
            loadAllCourses();
        }, [])
    );

    useEffect(() => {
        loadProgressOfUser();
    }, [courses])

    useEffect(() => {
        if (courses.length > 0) {
            filterCourses();
        }
    }, [courses, category, limit]);

    const filterCourses = () => {
        let result = [...courses];

        switch (category) {
            case "featured":
                result = result.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
                break;
            case "new":
                result = result.sort((a, b) => b._id.localeCompare(a._id));
                break;
            case "popular":
                result = result.sort((a, b) => (b.purchased || 0) - (a.purchased || 0));
                break;
            default:
                break;
        }

        if (limit > 0) {
            result = result.slice(0, limit);
        }

        setFilteredCourses(result);
    };

    const loadAllCourses = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setCourses([...response.data.courses]);
        } catch (error) {
            console.log(error);
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
            let _progresses: Progress[] = [];
            if(response.data.response && response.data.response.progress){
                let _ = response.data.response.progress;
                _progresses = _.map((progress: Progress) => ({
                    courseId: progress.courseId,
                    chapters: progress.chapters.map((chapter: Chapter) => ({
                        chapterId: chapter.chapterId,
                        isCompleted: chapter.isCompleted
                    }))
                }));
                let payload: { courseId: string; progress: number; name: string, total: number}[] = [];
                _progresses.forEach(item => {
                    let isCompleted = 0;
                    item.chapters.forEach(chapter => {
                        if(chapter.isCompleted === true){
                            isCompleted++;
                        }
                    })
                    let progress = (isCompleted / item.chapters.length);
                    let course = courses.find(course => course._id === item.courseId);
                    payload.push({
                        courseId: item.courseId,
                        progress: progress,
                        name: course?.name ?? '',
                        total: item.chapters.length
                    });
                })
                dispatch(userActions.saveProgressOfUser(payload))
            }
            setProgresses(_progresses);
        } catch (error) {
            console.log(error);
        }
    }

    const refreshCourses = () => {
        loadAllCourses();
    };

    useEffect(() => {
        // @ts-ignore
        navigation.setParams({
            refreshCourses: refreshCourses
        });
    }, [navigation]);

    let [fontsLoaded, fontError] = useFonts({
        Raleway_700Bold,
        Nunito_600SemiBold,
        Raleway_600SemiBold,
        Nunito_500Medium,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    if (displayMode === "horizontal") {
        return (
            <View style={styles.horizontalContainer}>
                <FlatList
                    data={filteredCourses}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContent}
                    ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    renderItem={({ item }) => (
                        <View style={styles.horizontalCardContainer}>
                            <CourseCard item={item} isHorizontal={true} />
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Zocial name="cloudapp" size={40} color="#ccc" />
                            <Text style={styles.emptyText}>Không có khóa học</Text>
                        </View>
                    )}
                />
                {!hideViewAll && category !== "all" && (
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/search")}
                        style={styles.viewAllButton}
                    >
                        <Text style={styles.viewAllText}>Xem tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.verticalContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    Nổi bật
                </Text>
                {!hideViewAll && (
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/search")}
                        style={styles.viewAllButton}
                    >
                        <Text style={styles.viewAllText}>
                            Tất cả
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {filteredCourses.length > 0 && (
                filteredCourses.map((item: any, index: number) => (
                    <View key={index}>
                        <CourseCard item={item} key={item._id} isHorizontal={false} />
                    </View>
                ))
            )}
            {filteredCourses.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Zocial name="cloudapp" size={60} style={{ textAlign: "center" }} color="#ccc" />
                    <Text style={styles.emptyText}>Không tồn tại dữ liệu</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    verticalContainer: { 
        flex: 1, 
        marginHorizontal: 16 
    },
    horizontalContainer: {
        marginBottom: 10,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12
    },
    headerTitle: {
        fontSize: 20,
        color: "#000",
        fontFamily: "Raleway_700Bold"
    },
    horizontalListContent: {
        
        paddingRight: 16,
        paddingVertical: 8
    },
    horizontalCardContainer: {
        width: 280,
        marginRight: 8
    },
    viewAllButton: {
        alignItems: "center", 
        justifyContent: "center"
    },
    viewAllText: {
        fontSize: 15,
        color: "#2467EC",
        fontFamily: "Nunito_600SemiBold"
    },
    emptyContainer: {
        flex: 1, 
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30
    },
    emptyText: {
        textAlign: 'center', 
        marginTop: 8,
        color: '#777'
    }
});

export default AllCourses;