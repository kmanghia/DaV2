import QuestionsCard from "@/components/cards/question.card";
import ReviewCard from "@/components/cards/review.card";
import Loader from "@/components/loader";
import useUser from "@/hooks/useUser";
import { URL_SERVER, URL_VIDEO, URL_VIDEOS } from "@/utils/url";
import { Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { widthPercentageToDP } from "react-native-responsive-screen";
import { Toast } from "react-native-toast-notifications";
import app from "../../app.json";
import { Video, ResizeMode } from 'expo-av';
import { useDispatch } from "react-redux";
import * as userActions from '../../utils/store/actions';

const styles = StyleSheet.create({
    button: {
        width: widthPercentageToDP("40%"),
        height: 40,
        backgroundColor: "#2467EC",
        marginVertical: 10,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    textBtn: {
        color: "white",
        fontSize: 16,
        textAlign: "justify",
        fontFamily: "Nunito_500Medium"
    },
    btn:{
        height: 30,
        minWidth: 100,
        backgroundColor: '#0085ff',
        borderRadius: 4,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    }
});

const CourseAccessScreen = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { courseData, courseId } = useLocalSearchParams();
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
    })
    const dispatch = useDispatch();
    const videoRef = useRef<Video>(null);

    
    useEffect(() => {
        if (courseContentData[activeVideo]) {
            loadVideoAndChapterState();
        }
    }, [courseContentData[activeVideo], activeVideo])

    const loadVideoAndChapterState = async  () => {
        try {
            let _lessonInfo = courseProgress?.chapters.find(chapter => chapter.chapterId === courseContentData[activeVideo]?._id);
            let _clone = {
                chapterId: _lessonInfo?.chapterId,
                isCompleted: _lessonInfo?.isCompleted
            } as Chapter;
            setLessonInfo(_clone);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.get(`${URL_VIDEO}/api/files/${courseContentData[activeVideo].videoUrl}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            if(response.data){
                setVideoData(response.data.url);
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
        }
    }

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
                setCourseContentData(response.data.content);
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

    const OnMarkAsCompleted = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const chapterId = lessonInfo.chapterId;
            const courseId = courseProgress?.courseId;
            await axios.put(`${URL_SERVER}/user/mark-chapter?courseId=${courseId}&chapterId=${chapterId}`, {}, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            let newChapters = courseProgress?.chapters.filter(chapter => chapter.chapterId !== chapterId);
            newChapters?.push({
                chapterId: chapterId, 
                isCompleted: true
            } as Chapter);
            // Update lại các bài học hoàn thành để dùng cho các lần sau
            let currCourseProgress = {
                courseId: courseProgress?.courseId,
                chapters: newChapters
            } as Progress
            setCourseProgress(currCourseProgress);
            setLessonInfo({
                chapterId: chapterId,
                isCompleted: true
            });
            let newProgress = calculateProgressBar(newChapters ?? []); 
            let payload = {
                courseId: courseId + '',
                progress: newProgress,
                name: data.name,
                total: courseProgress?.chapters.length ?? 0
            }
            dispatch(userActions.pushProgressOfUser(payload));
        } catch (error) {
            console.log(error);
        }
    }

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
                        size={20}
                        color={"#FF8D07"}
                        style={{ marginHorizontal: 2, marginBottom: 10 }}
                    />
                </TouchableOpacity>
            )
        }
        return stars;
    }

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <ScrollView style={{ flex: 1, padding: 10 }}>
                    <View style={{ width: "100%", aspectRatio: 18 / 9, borderRadius: 10 }}>
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
                                style={{width: widthPercentageToDP(90), marginHorizontal: 'auto', height: 200}}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                onError={(error) => console.log('Video Error:', error)}
                                onLoad={() => console.log('Video loaded successfully')}
                                shouldPlay={false}
                                isLooping={false}
                                isMuted={false}
                            />
                        ) : (
                            <View style={{width: widthPercentageToDP(90), marginHorizontal: 'auto', height: 200, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}}>
                                <Text>Loading video...</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: `${activeVideo === 0 ? '#ccc' : '#2467EC'}` }]}
                            disabled={activeVideo === 0}
                            onPress={() => setActiveVideo(activeVideo - 1)}
                        >
                            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                                {"Quay lại"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: `${(activeVideo === courseContentData.length - 1) ? '#ccc' : '#2467EC'}` }]}
                            disabled={activeVideo === courseContentData.length - 1}
                            onPress={() => setActiveVideo(activeVideo + 1)}
                        >
                            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                                {"Tiếp theo"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                            {activeVideo + 1}. {courseContentData[activeVideo]?.title}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            marginTop: 10,
                            marginHorizontal: 0,
                            backgroundColor: "#E1E9F8",
                            borderRadius: 50,
                            gap: 10,
                            justifyContent: "space-between"
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 36,
                                backgroundColor: activeButton === "About" ? "#2467EC" : "transparent",
                                borderRadius: activeButton === "About" ? 50 : 0
                            }}
                            onPress={() => setActiveButton("About")}
                        >
                            <Text
                                style={{
                                    color: activeButton === "About" ? "#FFF" : "#000",
                                    fontFamily: "Nunito_600SemiBold"
                                }}
                            >
                                Chi tiết
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 36,
                                borderRadius: activeButton === "Q&A" ? 50 : 0,
                                backgroundColor: activeButton === "Q&A" ? "#2467EC" : "transparent"
                            }}
                            onPress={() => setActiveButton("Q&A")}
                        >
                            <Text
                                style={{
                                    color: activeButton === "Q&A" ? "#FFF" : "#000",
                                    fontFamily: "Nunito_600SemiBold"
                                }}
                            >
                                Hỏi đáp
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 30,
                                borderRadius: activeButton === "Reviews" ? 50 : 0,
                                backgroundColor: activeButton === "Reviews" ? "#2467EC" : "transparent"
                            }}
                            onPress={() => setActiveButton("Reviews")}
                        >
                            <Text
                                style={{
                                    color: activeButton === "Reviews" ? "#FFF" : "#000",
                                    fontFamily: "Nunito_600SemiBold"
                                }}
                            >
                                Đánh giá
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {activeButton === "About" && (
                        <View
                            style={{
                                marginHorizontal: 10,
                                marginVertical: 25,
                                paddingHorizontal: 0,
                                height: 600
                            }}
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
                                    style={styles.btn}
                                    >
                                        <Text style={styles.textBtn}>
                                            Kiểm tra
                                        </Text>
                                </TouchableOpacity>
                                { lessonInfo.isCompleted ? (
                                    <TouchableOpacity
                                        style={[styles.btn, {marginLeft: 'auto', flexDirection: 'row', flexWrap: 'nowrap', gap: 4, alignItems: 'center', backgroundColor: '#237867'}]}
                                    >
                                        <Text style={styles.textBtn}>
                                            Đã hoàn thành
                                        </Text>
                                        <Feather name="check-circle" size={18} color="white" />
                                    </TouchableOpacity>
                                ):(
                                <TouchableOpacity
                                    onPress={() => OnMarkAsCompleted()}
                                    style={[styles.btn, {marginLeft: 'auto', flexDirection: 'row', flexWrap: 'nowrap', gap: 4, alignItems: 'center'}]}
                                    >
                                        <Text style={styles.textBtn}>
                                            Đánh dấu hoàn thành
                                        </Text>
                                </TouchableOpacity>
                                )}
                            </View>
                            <View style={{flexDirection: 'column', gap: 5}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <Text style={{ fontSize: 18, fontFamily: "Raleway_700Bold" }}>
                                        Tham khảo
                                    </Text>
                                    <TouchableOpacity
                                        style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 40,
                                            height: 40,
                                            borderRadius: 50,
                                            backgroundColor: '#0085ff',
                                            shadowColor: '#000', // Màu bóng
                                            shadowOffset: { width: 0, height: 5 }, // Độ lệch bóng
                                            shadowOpacity: 0.3, // Độ mờ của bóng
                                            shadowRadius: 6.27, // Độ lớn của bóng
                                            elevation: 10, // Độ cao của bóng trên Android
                                        }}
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
                                        <FontAwesome name="sticky-note" size={18} color="white" />
                                    </TouchableOpacity> 
                                </View>
                                {courseContentData[activeVideo]?.links.map((link: LinkType, index: number) => (
                                    <View
                                        key={`indexavjkahfkahkas-${index}`}
                                        style={{
                                            width: "100%",
                                            flexDirection: "column",
                                        }}>
                                        <Text
                                            style={{
                                                color: "#525258",
                                                fontSize: 16,
                                                marginTop: 10,
                                                textAlign: "justify",
                                                fontFamily: "Nunito_500Medium"
                                            }}
                                        >
                                            {link.title}
                                        </Text>
                                        <Text
                                            style={{
                                                color: "#525258",
                                                fontSize: 16,
                                                marginTop: 10,
                                                textAlign: "justify",
                                                fontFamily: "Nunito_500Medium"
                                            }}
                                        >
                                            {link.url}
                                        </Text>
                                    </View>
                                ))}
                                <Text
                                    style={{
                                        color: "#525258", 
                                        fontSize: 16,
                                        marginTop: 10,
                                        textAlign: "justify",
                                        fontFamily: "Nunito_500Medium"
                                    }}
                                >
                                    {courseContentData[activeVideo]?.description}
                                </Text>
                            </View>
                        </View>
                    )}
                    {activeButton === "Q&A" && (
                        <View style={{ flex: 1 }}>
                            <View>
                                <TextInput
                                    value={question}
                                    onChangeText={(v) => setQuestion(v)}
                                    placeholder="Đặt câu hỏi..."
                                    style={{
                                        marginVertical: 20,
                                        flex: 1,
                                        textAlignVertical: "top",
                                        justifyContent: "flex-start",
                                        backgroundColor: "#FFF",
                                        borderRadius: 10,
                                        height: 100,
                                        padding: 10
                                    }}
                                    multiline
                                />
                                <View
                                    style={{ flexDirection: "row", justifyContent: "flex-end" }}
                                >
                                    <TouchableOpacity
                                        style={styles.button}
                                        disabled={question === ""}
                                        onPress={() => OnHandleQuestionSubmit()}
                                    >
                                        <Text
                                            style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}
                                        >
                                            Gửi câu hỏi
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ marginBottom: 20 }}>
                                {courseContentData[activeVideo]?.questions
                                    ?.slice()
                                    ?.reverse()
                                    .map((item: CommentType, index: number) => (
                                        <View key={`${index}-f`}>
                                            <QuestionsCard
                                                item={item}
                                                fetchCourseContent={FetchCourseContent}
                                                courseData={data}
                                                contentId={courseContentData[activeVideo]?._id}
                                            />
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}
                    {activeButton === "Reviews" && (
                        <View style={{ marginHorizontal: 5, marginVertical: 25 }}>
                            {!reviewAvailable && (
                                <View>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                paddingBottom: 10,
                                                paddingLeft: 2,
                                                paddingRight: 5
                                            }}
                                        >
                                            Đưa ra đánh giá:
                                        </Text>
                                        {RenderStars()}
                                    </View>
                                    <TextInput
                                        value={review}
                                        onChangeText={(v) => setReview(v)}
                                        placeholder="Đưa ra đánh giá..."
                                        style={{
                                            flex: 1,
                                            textAlignVertical: "top",
                                            justifyContent: "flex-start",
                                            backgroundColor: "white",
                                            borderRadius: 10,
                                            height: 100,
                                            padding: 10
                                        }}
                                        multiline
                                    />
                                    <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                                        <TouchableOpacity
                                            style={styles.button}
                                            disabled={review === ""}
                                            onPress={() => OnHandleReviewSubmit()}
                                        >
                                            <Text
                                                style={{
                                                    color: "#FFF",
                                                    fontSize: 16,
                                                    fontWeight: "600"
                                                }}
                                            >
                                                Gửi Đánh giá
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            <View style={{ rowGap: 25 }}>
                                {courseReviews.map((item: ReviewType, index: number) => (
                                    <View key={`${index}-efa`}>
                                        <ReviewCard item={item} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView >
            )}
        </>
    )
}

export default CourseAccessScreen;