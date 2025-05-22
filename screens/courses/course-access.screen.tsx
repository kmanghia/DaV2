import React, { useCallback, useEffect, useRef, useState } from "react";
import QuestionsCard from "@/components/cards/question.card";
import ReviewCard from "@/components/cards/review.card";
import Loader from "@/components/loader";
import useUser from "@/hooks/useUser";
import { URL_SERVER, URL_VIDEO, URL_VIDEOS, URL_IMAGES } from "@/utils/url";
import { Feather, FontAwesome, AntDesign, MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Animated, Dimensions, FlatList, Linking, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image, Alert } from "react-native"
import { widthPercentageToDP } from "react-native-responsive-screen";
import { Toast } from "react-native-toast-notifications";
import app from "../../app.json";
import { Video, ResizeMode } from 'expo-av';
import { useDispatch } from "react-redux";
import * as userActions from '../../utils/store/actions';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Extended type for tracking video progress per chapter
interface VideoProgressState {
    [chapterId: string]: {
        hasWatched: boolean;
        progress: number;
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fe",
        padding: 15,
    },
    videoContainer: {
        width: "100%", 
        aspectRatio: 16 / 9, 
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    navigationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    button: {
        width: widthPercentageToDP("42%"),
        height: 48,
        marginVertical: 10,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textBtn: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "Nunito_600SemiBold"
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#1a1a2e",
    },
    tabContainer: {
        flexDirection: "row",
        marginVertical: 0,
        backgroundColor: "#E1E9F8",
        borderRadius: 50,
        width: '100%',
        justifyContent: "space-between",
        padding: 4,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
    },
    tabText: {
        fontSize: 16,
        fontFamily: "Nunito_600SemiBold"
    },
    contentContainer: {
        marginVertical: 20,
        paddingBottom: 100,
    },
    inputContainer: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        textAlignVertical: "top",
        justifyContent: "flex-start",
        backgroundColor: "#FFF",
        borderRadius: 12,
        minHeight: 100,
        padding: 12,
        fontFamily: "Nunito_500Medium",
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#E1E9F8",
    },
    actionButton: {
        height: 45,
        minWidth: 130,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    referenceContainer: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    noteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 6.27,
        elevation: 10,
    },
    linkItem: {
        paddingVertical: 6,
        marginVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    linkTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: "#2467EC",
        marginBottom: 3,
        fontFamily: "Nunito_500Medium",
        textDecorationLine: 'underline',
    },
    linkUrl: {
        fontSize: 14,
        color: "#2467EC",
        fontFamily: "Nunito_500Medium"
    },
    description: {
        color: "#525258", 
        fontSize: 15,
        marginTop: 10,
        lineHeight: 22,
        textAlign: "justify",
        fontFamily: "Nunito_500Medium"
    },
    descriptionWithBorder: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    lessonListButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2467EC',
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activeLesson: {
        backgroundColor: '#f0f7ff',
    },
    lessonNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#2467EC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    lessonNumberText: {
        color: 'white',
        fontWeight: 'bold',
    },
    lessonTitle: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    completedIcon: {
        marginLeft: 10,
        color: '#35B58D',
    },
    contentFrame: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1a1a2e",
        marginBottom: 8,
        fontFamily: "Nunito_600SemiBold"
    },
    progressBarContainer: {
        marginTop: 15,
        marginBottom: 5,
        backgroundColor: '#e0e0e0',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#2467EC',
        borderRadius: 3,
    },
    progressText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontFamily: "Nunito_500Medium"
    },
    favoriteButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    repliesContainer: {
        marginTop: 8,
        marginBottom: 15,
        paddingTop: 8,
        paddingLeft: 15,
        borderTopWidth: 1,
        borderTopColor: '#eaeaea',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
    },
    repliesTitle: {
        fontSize: 14,
        fontFamily: "Nunito_600SemiBold",
        color: '#666',
        marginBottom: 8,
    },
    replyItem: {
        backgroundColor: '#f2f2f2',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    replyUserName: {
        fontSize: 13,
        fontFamily: "Nunito_600SemiBold",
        color: '#333',
    },
    replyComment: {
        fontSize: 13,
        fontFamily: "Nunito_500Medium",
        color: '#444',
        paddingLeft: 32,
    },
    pinnedQuestionContainer: {
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
        paddingLeft: 2,
        borderRadius: 8,
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        position: 'relative',
        paddingTop: 16,
    },
    pinnedBadge: {
        position: 'absolute',
        top: 0,
        right: 10,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    pinnedText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        marginLeft: 4,
    },
});

const completionStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        backgroundColor: '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    headerGradient: {
        height: 140,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1A73E8',
    },
    confettiContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        padding: 25,
        alignItems: 'center',
        position: 'relative',
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: 'none',
    },
    star: {
        position: 'absolute',
        opacity: 0.8,
    },
    trophyContainer: {
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trophyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    congratsText: {
        fontSize: 32,
        fontFamily: 'Nunito_700Bold',
        color: '#FF5722',  // Vibrant orange color
        marginBottom: 15,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    infoContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 25,
    },
    messageText: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#444',
        textAlign: 'center',
        marginBottom: 8,
    },
    courseName: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: '#222',
        textAlign: 'center',
        marginBottom: 20,
    },
    certificateAchievement: {
        alignItems: 'center',
        marginTop: 5,
    },
    achievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        justifyContent: 'center',
    },
    achievementText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    buttonsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginRight: 30
    },
    laterButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    laterButtonText: {
        color: '#666',
        fontSize: 15,
        fontFamily: 'Nunito_600SemiBold',
    },
    viewButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 50,
        marginRight: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    viewButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
    },
});

const CourseAccessScreen = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
    const { user } = useUser();
    const { courseData, courseId, lessonId } = useLocalSearchParams();
    const data: CoursesType = JSON.parse(courseData as string);
    const [courseReviews, setCourseReviews] = useState<ReviewType[]>(data?.reviews ? data.reviews : []);

    const [courseContentData, setCourseContentData] = useState<CourseDataType[]>([]);
    const [activeVideo, setActiveVideo] = useState(0);
    const [activeButton, setActiveButton] = useState("About");
    const [question, setQuestion] = useState("");
    const [rating, setRating] = useState(1);
    const [review, setReview] = useState("");
    const [reviewAvailable, setReviewAvailable] = useState(false);
    const [token, setToken] = useState({
        access: '',
        refresh: ''
    });
    const [videoData, setVideoData] = useState('');
    const [courseProgress, setCourseProgress] = useState<Progress>();
    const [lessonInfo, setLessonInfo] = useState<Chapter>({
        chapterId: "",
        isCompleted: false
    });
    const [isLessonListVisible, setIsLessonListVisible] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [hasWatchedEnough, setHasWatchedEnough] = useState(false);
    // Track progress for each chapter independently
    const [chaptersProgress, setChaptersProgress] = useState<VideoProgressState>({});
    const [isLessonFavorited, setIsLessonFavorited] = useState(false);
    const [isFavoritingLesson, setIsFavoritingLesson] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionCertificate, setCompletionCertificate] = useState<any>(null);
    const fadeInBottomAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(0.8)).current;
    
    const dispatch = useDispatch();
    const videoRef = useRef<Video>(null);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Update hasWatchedEnough when switching chapters
    useEffect(() => {
        if (courseContentData[activeVideo]) {
            const currentChapterId = courseContentData[activeVideo]._id;
            
            // Reset current video progress
            setVideoProgress(0);
            
            // Get progress state for this specific chapter
            const chapterState = chaptersProgress[currentChapterId];
            if (chapterState && chapterState.hasWatched) {
                setHasWatchedEnough(chapterState.hasWatched);
                setVideoProgress(chapterState.progress);
            } else {
                // If no progress for this chapter, reset watched status
                setHasWatchedEnough(false);
            }
            
            // Load video data
            loadVideoAndChapterState();
        }
    }, [courseContentData[activeVideo], activeVideo]);

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded && !status.isBuffering) {
            const progress = status.positionMillis / status.durationMillis;
            setVideoProgress(progress);
            
            // Only set hasWatchedEnough for current chapter if not already completed
            if ((progress >= 0.9 || status.didJustFinish) && !lessonInfo.isCompleted) {
                const currentChapterId = courseContentData[activeVideo]._id;
                
                // Update progress for this specific chapter
                setChaptersProgress(prev => ({
                    ...prev,
                    [currentChapterId]: {
                        hasWatched: true,
                        progress: progress
                    }
                }));
                
                setHasWatchedEnough(true);
                console.log(`Chapter ${currentChapterId}: Watched enough (${Math.round(progress*100)}%)`);
            }
        }
    };

    const loadVideoAndChapterState = async () => {
        try {
            let _lessonInfo = courseProgress?.chapters.find(chapter => chapter.chapterId === courseContentData[activeVideo]?._id);
            let _clone = {
                chapterId: _lessonInfo?.chapterId || courseContentData[activeVideo]?._id,
                isCompleted: _lessonInfo?.isCompleted || false
            } as Chapter;
            setLessonInfo(_clone);
            
            // If lesson is already completed, no need to track progress
            if (_clone.isCompleted) {
                setHasWatchedEnough(true);
            }
            
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            // Try up to 3 times to load the video if needed
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    console.log(`Loading video attempt ${attempts + 1}...`);
                    const response = await axios.get(`${URL_VIDEO}/api/files/${courseContentData[activeVideo].videoUrl}`, {
                        headers: {
                            'access-token': accessToken,
                            'refresh-token': refreshToken
                        }
                    });
                    
                    if(response.data && response.data.url){
                        setVideoData(response.data.url);
                        break; // Success, exit the retry loop
                    } else {
                        console.log("No valid video URL received");
                        attempts++;
                        if (attempts < maxAttempts) {
                            // Wait a bit between attempts
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                } catch (videoError) {
                    console.log("Error loading video:", videoError);
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Wait a bit between attempts
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            
            if (attempts >= maxAttempts) {
                Toast.show("Không thể tải video, vui lòng thử lại sau", {
                    placement: "bottom",
                    type: "error"
                });
            }
        } catch (error) {
            console.log("Error loading video:", error);
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const subscription = async () => {
                await loadProgressOfUser();
                await FetchCourseContent();
                const isReviewAvailable = courseReviews.find(
                    (i: any) => i?.user?._id === user?._id
                )
                if (isReviewAvailable) {
                    setReviewAvailable(true);
                }
            }
            subscription();
        }, [])
    )

    // Thêm useEffect để xử lý khi có lessonId được truyền vào
    useEffect(() => {
        if (lessonId && courseContentData.length > 0) {
            console.log("Jumping to specific lesson ID:", lessonId);
            
            // Tìm chỉ mục của bài học trong courseContentData
            const lessonIndex = courseContentData.findIndex(
                lesson => lesson._id === lessonId
            );
            
            if (lessonIndex !== -1) {
                console.log("Found lesson at index:", lessonIndex);
                setActiveVideo(lessonIndex);
            } else {
                console.log("Lesson not found in course content");
            }
        }
    }, [lessonId, courseContentData]);

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
            let _progress: Progress[] = [];
            if(response.data.response && response.data.response.progress){
                let _ = response.data.response.progress;
                _progress = _.map((progress: Progress) => ({
                    courseId: progress.courseId,
                    chapters: progress.chapters.map((chapter: Chapter) => ({
                        chapterId: chapter.chapterId,
                        isCompleted: chapter.isCompleted
                    }))
                }));
            }
            if(_progress.length > 0){
                let progressOfCourse = _progress.filter(pro => pro.courseId === courseId)[0];
                let _clone = {
                    courseId: progressOfCourse.courseId,
                    chapters: progressOfCourse.chapters
                } as Progress;
                setCourseProgress(_clone);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const FetchCourseContent = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const response = await axios.get(`${URL_SERVER}/get-course-content/${courseId}`, {
                headers: {
                    "access-token": accessToken,
                    "refresh-token": refreshToken
                }
            });
            if(response.data){
                // Sort questions in each content item - pinned questions first
                const sortedContent = response.data.content.map((contentItem: any) => {
                    if (contentItem.questions && contentItem.questions.length > 0) {
                        // Sort questions - pinned first, then by date
                        contentItem.questions.sort((a: any, b: any) => {
                            // Pinned questions first
                            if (a.isPinned !== b.isPinned) {
                                return a.isPinned ? -1 : 1;
                            }
                            // Then by date (newest first)
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        });
                    }
                    return contentItem;
                });
                
                setCourseContentData(sortedContent);
            }
            setToken({
                access: accessToken as string,
                refresh: refreshToken as string
            })
            setIsLoading(false);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            router.push({
                pathname: "/(routes)/course-details",
                params: { item: JSON.stringify(data), courseId: data?._id },
            });
        }
    }

    const OnHandleQuestionSubmit = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            await axios.put(`${URL_SERVER}/add-question`, {
                question: question,
                courseId: courseId,
                contentId: courseContentData[activeVideo]?._id
            }, {
                headers: {
                    "access-token": accessToken,
                    "refresh-token": refreshToken
                }
            });
            setQuestion("");
            Toast.show("Câu hỏi đã tạo mới thành công!", {
                placement: "bottom",
                type: "success"
            });
            await FetchCourseContent();
        } catch (error) {
            console.log(error);
        }
    }

    const OnHandleReviewSubmit = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            await axios.put(`${URL_SERVER}/add-review/${courseId}`,
                { review, rating },
                {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                }
            );
            setRating(1);
            setReview("");
            let currentCourseReview = courseReviews;
            let _data: ReviewType = {
                user: user!,
                comment: review,
                rating: rating
            }
            currentCourseReview = [_data, ...currentCourseReview];
            setCourseReviews(currentCourseReview);
        } catch (error) {
            console.log(error);
        }
    }

    const handleNavigation = (direction: 'next' | 'prev') => {
        // Reset video playback position but keep progress state per chapter
        if (videoRef.current) {
            videoRef.current.setPositionAsync(0);
        }
        
        // Disable navigation temporarily to prevent multiple rapid clicks
        setIsLoading(true);
        
        // Add a small delay to ensure any pending requests complete
        setTimeout(() => {
            if (direction === 'next' && activeVideo < courseContentData.length - 1) {
                setActiveVideo(activeVideo + 1);
            } else if (direction === 'prev' && activeVideo > 0) {
                setActiveVideo(activeVideo - 1);
            }
            setIsLoading(false);
        }, 500);
    };
    
    const OnMarkAsCompleted = async () => {
        if (isMarkingCompleted) return;
        
        try {
            setIsMarkingCompleted(true);
            
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            // Make sure we have valid IDs
            const chapterId = courseContentData[activeVideo]?._id;
            const courseId = data._id;
            
            if (!chapterId || !courseId) {
                console.error("Missing chapterId or courseId");
                Toast.show("Không thể đánh dấu hoàn thành bài học, thiếu thông tin!", {
                    placement: "bottom",
                    type: "error"
                });
                setIsMarkingCompleted(false);
                return;
            }
            
            // Log request details for debugging
            console.log("Mark chapter request:", {
                chapterId,
                courseId,
                url: `${URL_SERVER}/user/mark-chapter?courseId=${courseId}&chapterId=${chapterId}`
            });
            
            // Fix: Changed to POST request with body parameters instead of query parameters
            const response = await axios.put(`${URL_SERVER}/user/mark-chapter?courseId=${courseId}&chapterId=${chapterId}`, {}, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            console.log("Mark chapter response:", response.data);
            
            if (response.data && response.data.success) {
                // Update local progress state
                let newChapters = courseProgress?.chapters ? [...courseProgress.chapters] : [];
                // Filter out the current chapter if it exists
                newChapters = newChapters.filter(chapter => chapter.chapterId !== chapterId);
                // Add the updated chapter information
                newChapters.push({
                    chapterId: chapterId, 
                    isCompleted: true
                } as Chapter);
                
                // Update course progress
                let currCourseProgress = {
                    courseId: courseId,
                    chapters: newChapters
                } as Progress;
                
                setCourseProgress(currCourseProgress);
                
                // Update lesson info
                setLessonInfo({
                    chapterId: chapterId,
                    isCompleted: true
                });
                
                // Calculate and update progress
                let newProgress = calculateProgressBar(newChapters); 
                let payload = {
                    courseId: courseId + '',
                    progress: newProgress,
                    name: data.name,
                    total: newChapters.length
                };
                
                dispatch(userActions.pushProgressOfUser(payload));
                
                // Check if all chapters are completed after this update
                const allChaptersCompleted = newChapters.every(chapter => chapter.isCompleted);
                
                if (allChaptersCompleted) {
                    // Fetch certificate immediately if all chapters are completed
                    try {
                        // Fetch certificate data
                        const certificateResponse = await axios.get(
                            `${URL_SERVER}/get-user-certificates-by-courseId/${courseId}`,
                            {
                                headers: {
                                    "access-token": accessToken,
                                    "refresh-token": refreshToken
                                }
                            }
                        );
                        
                        if (certificateResponse.data.success && certificateResponse.data.certificates.length > 0) {
                            const certificate = certificateResponse.data.certificates[0];
                            setCompletionCertificate(certificate);
                            
                            // Show custom completion modal with animation
                            setShowCompletionModal(true);
                            
                            // Start animations
                            Animated.parallel([
                                Animated.timing(fadeInBottomAnimation, {
                                    toValue: 1,
                                    duration: 800,
                                    useNativeDriver: true,
                                }),
                                Animated.spring(scaleAnimation, {
                                    toValue: 1,
                                    friction: 7,
                                    tension: 40,
                                    useNativeDriver: true
                                })
                            ]).start();
                            
                        } else {
                            // Certificate not found, show a nicer toast
                            Toast.show("Chứng chỉ của bạn đang được xử lý. Vui lòng kiểm tra lại sau.", {
                                type: "warning",
                                placement: "bottom",
                                duration: 3000
                            });
                        }
                    } catch (error) {
                        console.error("Error fetching certificate:", error);
                        Toast.show("Có lỗi xảy ra khi tải chứng chỉ. Vui lòng thử lại sau.", {
                            type: "error",
                            placement: "bottom",
                            duration: 3000
                        });
                    }
                } else {
                    // Show standard success message
                    Toast.show("Đã đánh dấu hoàn thành bài học!", {
                        placement: "bottom",
                        type: "success"
                    });
                }
            } else {
                throw new Error("Failed to mark chapter as completed");
            }
        } catch (error) {
            console.error("Error marking chapter as completed:", error);
            
            if (axios.isAxiosError(error)) {
                console.error("Axios error details:", {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
            }
            
            // Show error message
            Toast.show("Không thể đánh dấu hoàn thành bài học, vui lòng thử lại!", {
                placement: "bottom",
                type: "error"
            });
        } finally {
            setIsMarkingCompleted(false);
        }
    };

    const calculateProgressBar = (chapters: Chapter[]) => {
        let isCompleted = 0;
        chapters.forEach(chapter => {
            if(chapter.isCompleted){
                isCompleted++;
            }
        })
        let progress = isCompleted / chapters.length;
        return progress;
    }

    const RenderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <FontAwesome
                        name={i <= rating ? "star" : "star-o"}
                        size={22}
                        color={"#FF8D07"}
                        style={{ marginHorizontal: 3, marginBottom: 10 }}
                    />
                </TouchableOpacity>
            )
        }
        return stars;
    }

    const handleLessonSelect = (index: number) => {
        setActiveVideo(index);
        setIsLessonListVisible(false);
    };
    
    const isLessonCompleted = (chapterId: string) => {
        return courseProgress?.chapters.some(
            chapter => chapter.chapterId === chapterId && chapter.isCompleted
        ) || false;
    };

    // Kiểm tra trạng thái yêu thích khi chuyển bài học
    useEffect(() => {
        if (courseContentData[activeVideo]) {
            checkLessonFavoriteStatus();
        }
    }, [courseContentData, activeVideo]);
    
    // Hàm kiểm tra trạng thái yêu thích
    const checkLessonFavoriteStatus = async () => {
        if (!courseContentData[activeVideo] || !courseContentData[activeVideo]._id) return;
        
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            
            const currentLessonId = courseContentData[activeVideo]._id;
            
            const response = await axios.get(
                `${URL_SERVER}/wishlist/status?type=lesson&courseId=${courseId}&lessonId=${currentLessonId}`, 
                {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                }
            );
            
            if (response.data && response.data.success) {
                setIsLessonFavorited(response.data.isFavorited);
            }
        } catch (error) {
            console.log("Error checking favorite status:", error);
        }
    };
    
    // Hàm thêm/xóa yêu thích
    const toggleLessonFavorite = async () => {
        if (isFavoritingLesson) return;
        
        try {
            setIsFavoritingLesson(true);
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            
            const currentLessonId = courseContentData[activeVideo]._id;
            
            if (isLessonFavorited) {
                // Xóa khỏi danh sách yêu thích
                const response = await axios.delete(`${URL_SERVER}/wishlist/remove`, {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken,
                        "Content-Type": "application/json"
                    },
                    data: {
                        courseId: courseId,
                        lessonId: currentLessonId,
                        type: 'lesson'
                    }
                });
                
                if (response.data.success) {
                    setIsLessonFavorited(false);
                    Toast.show("Đã xóa bài học khỏi danh sách yêu thích", {
                        placement: "bottom",
                        type: "success"
                    });
                }
            } else {
                // Thêm vào danh sách yêu thích
                const response = await axios.post(
                    `${URL_SERVER}/wishlist/lesson`,
                    {
                        courseId: courseId,
                        lessonId: currentLessonId
                    },
                    {
                        headers: {
                            "access-token": accessToken,
                            "refresh-token": refreshToken
                        }
                    }
                );
                
                if (response.data.success) {
                    setIsLessonFavorited(true);
                    Toast.show("Đã thêm bài học vào danh sách yêu thích", {
                        placement: "bottom",
                        type: "success"
                    });
                }
            }
        } catch (error) {
            console.log("Error toggling favorite:", error);
            Toast.show("Có lỗi xảy ra khi cập nhật yêu thích", {
                placement: "bottom",
                type: "error"
            });
        } finally {
            setIsFavoritingLesson(false);
        }
    };

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <ScrollView style={styles.container}>
                    <Animated.View 
                        style={[
                            styles.videoContainer, 
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] 
                        }]}>
                        <TouchableOpacity 
                            style={styles.lessonListButton}
                            onPress={() => setIsLessonListVisible(true)}
                        >
                            <MaterialIcons name="format-list-bulleted" size={24} color="white" />
                        </TouchableOpacity>
                        
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
                                style={{width: '100%', height: '100%'}}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                onError={(error) => console.log('Video Error:', error)}
                                onLoad={() => console.log('Video loaded successfully')}
                                shouldPlay={false}
                                isLooping={false}
                                isMuted={false}
                                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                            />
                        ) : (
                            <View style={{width: '100%', height: 200, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}}>
                                <Text>Loading video...</Text>
                            </View>
                        )}
                    </Animated.View>
                    
                    {/* Progress text for clarity */}
                    {!lessonInfo.isCompleted && (
                        <View style={{paddingHorizontal: 10, marginTop: 5}}>
                            <Text style={{fontSize: 13, color: '#666', fontStyle: 'italic'}}>
                                Bài học hiện tại: {hasWatchedEnough ? 'Đã xem đủ' : 'Chưa xem đủ'} ({Math.round(videoProgress * 100)}%)
                            </Text>
                        </View>
                    )}
                    
                    <View style={styles.navigationContainer}>
                        <TouchableOpacity
                            disabled={activeVideo === 0}
                            onPress={() => handleNavigation('prev')}
                        >
                            <LinearGradient
                                colors={activeVideo === 0 ? ['#a0a0a0', '#888888'] : ['#5D87E4', '#4776E6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <AntDesign name="left" size={16} color="#FFF" />
                                    <Text style={styles.textBtn}>Quay lại</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            disabled={activeVideo === courseContentData.length - 1}
                            onPress={() => handleNavigation('next')}
                        >
                            <LinearGradient
                                colors={(activeVideo === courseContentData.length - 1) ? ['#a0a0a0', '#888888'] : ['#E56767', '#D84848']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <Text style={styles.textBtn}>Tiếp theo</Text>
                                    <AntDesign name="right" size={16} color="#FFF" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.title}>
                            {activeVideo + 1}. {courseContentData[activeVideo]?.title}
                        </Text>
                    </Animated.View>
                    
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                {backgroundColor: activeButton === "About" ? "#2467EC" : "transparent"}
                            ]}
                            onPress={() => setActiveButton("About")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    {color: activeButton === "About" ? "#FFF" : "#333"}
                                ]}
                            >
                                Chi tiết
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                {backgroundColor: activeButton === "Q&A" ? "#2467EC" : "transparent"}
                            ]}
                            onPress={() => setActiveButton("Q&A")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    {color: activeButton === "Q&A" ? "#FFF" : "#333"}
                                ]}
                            >
                                Hỏi đáp
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                {backgroundColor: activeButton === "Reviews" ? "#2467EC" : "transparent"}
                            ]}
                            onPress={() => setActiveButton("Reviews")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    {color: activeButton === "Reviews" ? "#FFF" : "#333"}
                                ]}
                            >
                                Đánh giá
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {activeButton === "About" && (
                        <Animated.View
                            style={[
                                styles.contentContainer,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <View style={{marginVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <TouchableOpacity
                                    onPress={() => router.push({
                                        pathname: '/course-quizz',
                                        params: {
                                            courseData: courseData,
                                            activeVideo: activeVideo,
                                            id: courseId
                                        }
                                    })}
                                >
                                    <LinearGradient
                                        colors={['#4A90E2', '#5A9AE6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.actionButton}
                                    >
                                        <Text style={styles.textBtn}>
                                            Kiểm tra
                                        </Text>
                                        <AntDesign name="form" size={16} color="white" />
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                {/* Nút yêu thích bài học */}
                                <TouchableOpacity
                                    onPress={toggleLessonFavorite}
                                    disabled={isFavoritingLesson}
                                >
                                    <LinearGradient
                                        colors={isLessonFavorited ? ['#FF6B6B', '#FF8E8E'] : ['#F0F0F0', '#E0E0E0']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.favoriteButton}
                                    >
                                        {isFavoritingLesson ? (
                                            <ActivityIndicator size="small" color={isLessonFavorited ? "white" : "#666"} />
                                        ) : (
                                            <AntDesign 
                                                name={isLessonFavorited ? "heart" : "hearto"} 
                                                size={20} 
                                                color={isLessonFavorited ? "white" : "#666"} 
                                            />
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                { lessonInfo.isCompleted ? (
                                    <TouchableOpacity
                                        style={{marginLeft: 'auto'}}
                                    >
                                        <LinearGradient
                                            colors={['#2E9E7A', '#35B58D']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.actionButton}
                                        >
                                            <Text style={styles.textBtn}>
                                                Đã hoàn thành
                                            </Text>
                                            <Feather name="check-circle" size={18} color="white" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ):(
                                    <TouchableOpacity
                                        onPress={() => OnMarkAsCompleted()}
                                        style={{marginLeft: 'auto'}}
                                        disabled={!hasWatchedEnough || isMarkingCompleted}
                                    >
                                        <LinearGradient
                                            colors={hasWatchedEnough ? ['#4776E6', '#5D87E4'] : ['#a0a0a0', '#888888']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.actionButton}
                                        >
                                            {isMarkingCompleted ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <>
                                                    <Text style={styles.textBtn}>
                                                        {hasWatchedEnough ? 'Đánh dấu hoàn thành' : 'Chưa hoàn thành'}
                                                    </Text>
                                                    <Feather name="check" size={18} color="white" />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            {!lessonInfo.isCompleted && !hasWatchedEnough && (
                                <View>
                                    <Text style={styles.progressText}>
                                        Bạn đã xem {Math.round(videoProgress * 100)}% - Cần xem ít nhất 90% video để đánh dấu hoàn thành
                                    </Text>
                                    <View style={styles.progressBarContainer}>
                                        <View style={[styles.progressBar, {width: `${videoProgress * 100}%`}]} />
                                    </View>
                                </View>
                            )}
                            
                            <View style={{marginTop: 20}}>
                                <View style={styles.referenceContainer}>
                                    <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e" }}>
                                        Nội dung
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push({
                                            pathname: '/(routes)/note-lesson',
                                            params: {
                                                courseId: courseId,
                                                courseDataId: lessonInfo.chapterId, 
                                                name: data.name,
                                                nameLesson: `${courseContentData[activeVideo].title}`
                                            }
                                        })}
                                    >
                                        <LinearGradient
                                            colors={['#E67E5D', '#E67E5D']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.noteButton}
                                        >
                                            <FontAwesome name="sticky-note" size={20} color="white" />
                                        </LinearGradient>
                                    </TouchableOpacity> 
                                </View>
                                
                                <View style={styles.contentFrame}>
                                    {courseContentData[activeVideo]?.links && courseContentData[activeVideo]?.links.length > 0 && (
                                        <>
                                            {courseContentData[activeVideo]?.links.map((link: LinkType, index: number) => (
                                                <TouchableOpacity
                                                    key={`indexavjkahfkahkas-${index}`}
                                                    style={styles.linkItem}
                                                    onPress={() => {
                                                        // Open the URL in external browser
                                                        if (link.url) {
                                                            Linking.openURL(link.url).catch(err => 
                                                                console.error("Couldn't open URL: ", err)
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.linkTitle}>
                                                        Tham khảo: {link.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </>
                                    )}
                                    
                                    <Text 
                                        style={[
                                            styles.description, 
                                            courseContentData[activeVideo]?.links && 
                                            courseContentData[activeVideo]?.links.length > 0 ? 
                                            styles.descriptionWithBorder : null
                                        ]}
                                    >
                                        {courseContentData[activeVideo]?.description}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                    
                    {activeButton === "Q&A" && (
                        <Animated.View 
                            style={[
                                styles.contentContainer,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={question}
                                    onChangeText={(v) => setQuestion(v)}
                                    placeholder="Đặt câu hỏi của bạn tại đây..."
                                    style={styles.input}
                                    multiline
                                />
                                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 15 }}>
                                    <TouchableOpacity
                                        disabled={question === ""}
                                        onPress={() => OnHandleQuestionSubmit()}
                                    >
                                        <LinearGradient
                                            colors={question === "" ? ['#a0a0a0', '#888888'] : ['#4776E6', '#5D87E4']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.actionButton}
                                        >
                                            <Text style={styles.textBtn}>Gửi câu hỏi</Text>
                                            <Feather name="send" size={16} color="white" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                            <View style={{ marginBottom: 20 }}>
                                {courseContentData[activeVideo]?.questions
                                    ?.map((item: any, index: number) => (
                                    <Animated.View 
                                        key={`${index}-f`}
                                        style={{ 
                                            opacity: fadeAnim, 
                                            transform: [{ translateY: slideAnim }],
                                            marginBottom: 15 
                                        }}
                                    >
                                        <View style={[
                                            item.isPinned && styles.pinnedQuestionContainer
                                        ]}>
                                            {item.isPinned && (
                                                <View style={styles.pinnedBadge}>
                                                    <AntDesign name="pushpin" size={14} color="#fff" />
                                                    <Text style={styles.pinnedText}>Đã ghim</Text>
                                                </View>
                                            )}
                                            <QuestionsCard
                                                item={item}
                                                fetchCourseContent={FetchCourseContent}
                                                courseData={data}
                                                contentId={courseContentData[activeVideo]?._id}
                                            />
                                        </View>
                                    </Animated.View>
                                ))}
                            </View>
                        </Animated.View>
                    )}
                    
                    {activeButton === "Reviews" && (
                        <Animated.View 
                            style={[
                                styles.contentContainer,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            {!reviewAvailable && (
                                <View style={styles.inputContainer}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: "600",
                                                paddingRight: 10
                                            }}
                                        >
                                            Đánh giá:
                                        </Text>
                                        <View style={{flexDirection: 'row'}}>
                                            {RenderStars()}
                                        </View>
                                    </View>
                                    <TextInput
                                        value={review}
                                        onChangeText={(v) => setReview(v)}
                                        placeholder="Chia sẻ đánh giá của bạn về khóa học..."
                                        style={styles.input}
                                        multiline
                                    />
                                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 15 }}>
                                        <TouchableOpacity
                                            disabled={review === ""}
                                            onPress={() => OnHandleReviewSubmit()}
                                        >
                                            <LinearGradient
                                                colors={review === "" ? ['#a0a0a0', '#888888'] : ['#E56767', '#D84848']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.actionButton}
                                            >
                                                <Text style={styles.textBtn}>Gửi đánh giá</Text>
                                                <AntDesign name="star" size={16} color="white" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            
                            <View style={{ rowGap: 15 }}>
                                {courseReviews.map((item: ReviewType, index: number) => (
                                    <Animated.View 
                                        key={`${index}-efa`}
                                        style={{ 
                                            opacity: fadeAnim, 
                                            transform: [{ translateY: slideAnim }] 
                                        }}
                                    >
                                        <ReviewCard item={item} />
                                        
                                        {/* Display review replies */}
                                        {item.commentReplies && item.commentReplies.length > 0 && (
                                            <View style={styles.repliesContainer}>
                                                <Text style={styles.repliesTitle}>Phản hồi:</Text>
                                                {item.commentReplies.map((reply: any, replyIndex: number) => (
                                                    <View key={`reply-${replyIndex}`} style={styles.replyItem}>
                                                        <View style={styles.replyHeader}>
                                                            <Image 
                                                                source={{ 
                                                                    uri: reply?.user?.avatar?.url 
                                                                        ? `${URL_IMAGES}/${reply.user.avatar.url}`
                                                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.name || 'Mentor')}`
                                                                }}
                                                                style={styles.replyAvatar}
                                                            />
                                                            <View>
                                                                <Text style={styles.replyUserName}>
                                                                    {reply?.user?.name || 'Mentor'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.replyComment}>{reply.comment}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </Animated.View>
                                ))}
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            )}
            
            <Modal
                visible={isLessonListVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsLessonListVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Danh sách bài học</Text>
                            <TouchableOpacity onPress={() => setIsLessonListVisible(false)}>
                                <AntDesign name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={courseContentData}
                            keyExtractor={(item, index) => `lesson-${index}`}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity 
                                    style={[
                                        styles.lessonItem,
                                        activeVideo === index && styles.activeLesson
                                    ]}
                                    onPress={() => handleLessonSelect(index)}
                                >
                                    <View style={styles.lessonNumber}>
                                        <Text style={styles.lessonNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                                    {isLessonCompleted(item._id) && (
                                        <Feather name="check-circle" size={20} style={styles.completedIcon} />
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
            
            {/* Elegant Course Completion Modal */}
            <Modal
                visible={showCompletionModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCompletionModal(false)}
            >
                <View style={completionStyles.modalOverlay}>
                    <Animated.View 
                        style={[
                            completionStyles.modalContent,
                            { 
                                opacity: fadeInBottomAnimation,
                                transform: [
                                    { translateY: fadeInBottomAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0]
                                    })},
                                    { scale: scaleAnimation }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#3366ff', '#5D87E4']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={completionStyles.headerGradient}
                        >
                            <View style={completionStyles.confettiContainer}>
                                {/* Animated confetti or stars could be placed here */}
                                <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
                                    <MaterialCommunityIcons name="certificate-outline" size={64} color="#FFF" />
                                </Animatable.View>
                            </View>
                        </LinearGradient>
                        
                        <View style={completionStyles.contentContainer}>
                            {/* Add decorative elements */}
                            <View style={completionStyles.decorationContainer}>
                                <Animatable.View animation="fadeIn" delay={200} style={[completionStyles.star, { top: -10, left: 20 }]}>
                                    <Ionicons name="star" size={24} color="#FFD700" />
                                </Animatable.View>
                                <Animatable.View animation="fadeIn" delay={300} style={[completionStyles.star, { top: 10, right: 25 }]}>
                                    <Ionicons name="star" size={18} color="#FFD700" />
                                </Animatable.View>
                                <Animatable.View animation="fadeIn" delay={400} style={[completionStyles.star, { bottom: 60, left: 15 }]}>
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                </Animatable.View>
                                <Animatable.View animation="fadeIn" delay={500} style={[completionStyles.star, { bottom: 40, right: 20 }]}>
                                    <Ionicons name="star" size={20} color="#FFD700" />
                                </Animatable.View>
                            </View>

                            <Animatable.View 
                                style={completionStyles.trophyContainer}
                                animation="bounceIn"
                                delay={200}
                            >
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={completionStyles.trophyCircle}
                                >
                                    <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite" duration={2000}>
                                        <MaterialCommunityIcons name="trophy-award" size={50} color="#FFFFFF" />
                                    </Animatable.View>
                                </LinearGradient>
                            </Animatable.View>
                            
                            <Animatable.Text 
                                style={completionStyles.congratsText}
                                animation="zoomIn"
                                delay={400}
                            >
                                Chúc mừng!
                            </Animatable.Text>
                            
                            <Animatable.View 
                                style={completionStyles.infoContainer}
                                animation="fadeIn"
                                delay={600}
                            >
                                <Text style={completionStyles.messageText}>
                                    Bạn đã hoàn thành khóa học
                                </Text>
                                <Text style={completionStyles.courseName}>
                                    "{data.name}"
                                </Text>

                                <Animatable.View 
                                    animation="fadeIn" 
                                    delay={800}
                                    style={completionStyles.certificateAchievement}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#2E7D32']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={completionStyles.achievementBadge}
                                    >
                                        <Ionicons name="ribbon" size={16} color="#FFF" style={{marginRight: 5}} />
                                        <Text style={completionStyles.achievementText}>
                                            Chứng chỉ khóa học
                                        </Text>
                                    </LinearGradient>
                                </Animatable.View>
                            </Animatable.View>
                            
                            <Animatable.View 
                                style={completionStyles.buttonsContainer}
                                animation="fadeIn"
                                delay={1000}
                            >
                                <TouchableOpacity 
                                    style={completionStyles.laterButton}
                                    onPress={() => setShowCompletionModal(false)}
                                >
                                    <Text style={completionStyles.laterButtonText}>
                                        Xem sau
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowCompletionModal(false);
                                        // Navigate to certificate view with certificate data
                                        router.push({
                                            pathname: "/(routes)/view-certificate",
                                            params: { 
                                                certificate: JSON.stringify(completionCertificate),
                                                course: JSON.stringify({ 
                                                    title: completionCertificate.courseNameAtIssue 
                                                }),
                                                userName: completionCertificate.userNameAtIssue
                                            }
                                        });
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#3366ff', '#1E3A8A']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={completionStyles.viewButton}
                                    >
                                        <Text style={completionStyles.viewButtonText}>
                                            Xem chứng chỉ
                                        </Text>
                                        <Ionicons name="document-text" size={18} color="#FFF" style={{marginLeft: 8}} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animatable.View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    )
}

export default CourseAccessScreen;