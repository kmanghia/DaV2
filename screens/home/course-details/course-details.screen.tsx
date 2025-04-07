import ReviewCard from "@/components/cards/review.card";
import CourseLesson from "@/components/course-lesson";
import Loader from "@/components/loader";
import useUser from "@/hooks/useUser";
import { URL_SERVER, URL_VIDEO, URL_VIDEOS } from "@/utils/url";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
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
} from "react-native"
import { Colors } from 'react-native/Libraries/NewAppScreen';
import app from "../../../package.json";
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { widthPercentageToDP } from "react-native-responsive-screen";


const CourseDetailsScreen = () => {

    const videoRef = useRef<Video>(null);  

    const [activeButton, setActiveButton] = useState("About");
    const { user, loading } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);
    const { item } = useLocalSearchParams();
    const [courseData, setCourseData] = useState<CoursesType>(item ? JSON.parse(item as string) : null); // truyền ngu vl 
    const [courseInfo, setCourseInfo] = useState<CoursesType>();
    const [checkPurchased, setCheckPurchased] = useState(false);
    const [videoData, setVideoData] = useState("");
    const [token, setToken] = useState({
        access: "",
        refresh: ""
    });


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

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <View style={{ flex: 1, marginTop: 16 }}>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        <View style={{ marginHorizontal: 16 }}>
                            <View style={{ position: "absolute", zIndex: 14, right: 0 }}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: "#141517",
                                        paddingVertical: 6,
                                        paddingHorizontal: 12,
                                        borderRadius: 3,
                                        marginTop: 8,
                                        marginRight: 8,
                                    }}
                                >
                                    <FontAwesome name="star" size={14} color={"#FFB800"} />
                                    <Text
                                        style={{
                                            color: "white",
                                            marginLeft: 4,
                                            fontFamily: "Nunito_600SemiBold",
                                        }}
                                    >
                                        {courseData?.ratings?.toFixed(1)}
                                    </Text>
                                </View>
                            </View>
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
                                        videoStyle={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <View style={{width: widthPercentageToDP(90), marginHorizontal: 'auto', height: 200, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}}>
                                        <Text>Loading video...</Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                style={{
                                    marginHorizontal: 16,
                                    marginTop: 15,
                                    fontSize: 20,
                                    fontWeight: "600",
                                    fontFamily: "Raleway_700Bold",
                                }}
                            >
                                {courseData?.name}
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingRight: 10,
                                    paddingTop: 5
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingRight: 10,
                                        paddingTop: 5
                                    }}
                                >
                                    <View
                                        style={{ flexDirection: "row" }}
                                    >
                                        <Text
                                            style={{
                                                color: "#000",
                                                fontSize: 22,
                                                marginLeft: 10,
                                                paddingVertical: 10,
                                            }}
                                        >
                                            {courseData?.price?.toLocaleString()}đ
                                        </Text>
                                        <Text
                                            style={{
                                                color: "#808080",
                                                fontSize: 20,
                                                marginLeft: 10,
                                                textDecorationLine: "line-through",
                                            }}
                                        >
                                            {courseData?.estimatedPrice?.toLocaleString()}đ
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 15 }}>
                                    {courseData?.purchased} students
                                </Text>
                            </View>
                            <View style={{ padding: 10 }}>
                                <Text style={{ fontSize: 20, fontWeight: "600" }}>
                                    Các yêu cầu của khóa học
                                </Text>
                                {courseData?.prerequisites.map(
                                    (item: PrerequisiteType, index: number) => (
                                        <View
                                            key={index}
                                            style={{
                                                flexDirection: "row",
                                                width: "95%",
                                                paddingVertical: 5,
                                            }}
                                        >
                                            <Ionicons name="checkmark-done-outline" size={18} />
                                            <Text style={{ paddingLeft: 5, fontSize: 16 }}>
                                                {item.title}
                                            </Text>
                                        </View>
                                    )
                                )}
                            </View>
                            <View style={{ padding: 10 }}>
                                <Text style={{ fontSize: 20, fontWeight: "600" }}>
                                    Lợi ích khóa học mang lại
                                </Text>
                                {courseData?.benefits.map((item: BenefitType, index: number) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: "row",
                                            width: "95%",
                                            paddingVertical: 5
                                        }}
                                    >
                                        <Ionicons name="checkmark-done-outline" size={18} />
                                        <Text style={{ paddingLeft: 5, fontSize: 16 }}>
                                            {item.title}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 25,
                                    backgroundColor: "#E1E9F0",
                                    borderRadius: 50
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 30,
                                        backgroundColor: activeButton === "About" ? "#2467EC" : "transparent",
                                        borderRadius: activeButton === "About" ? 50 : 0
                                    }}
                                    onPress={() => setActiveButton("About")}
                                >
                                    <Text
                                        style={{
                                            color: activeButton === "About" ? "#fff" : "#000",
                                            fontFamily: "Nunito_600SemiBold"
                                        }}
                                    >
                                        Thông tin
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 36,
                                        backgroundColor:
                                            activeButton === "Lessons" ? "#2467EC" : "transparent",
                                        borderRadius: activeButton === "Lessons" ? 50 : 0,
                                    }}
                                    onPress={() => setActiveButton("Lessons")}
                                >
                                    <Text
                                        style={{
                                            color: activeButton === "Lessons" ? "#fff" : "#000",
                                            fontFamily: "Nunito_600SemiBold",
                                        }}
                                    >
                                        Bài giảng
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 30,
                                        backgroundColor:
                                            activeButton === "Reviews" ? "#2467EC" : "transparent",
                                        borderRadius: activeButton === "Reviews" ? 50 : 0,
                                    }}
                                    onPress={() => setActiveButton("Reviews")}
                                >
                                    <Text
                                        style={{
                                            color: activeButton === "Reviews" ? "#fff" : "#000",
                                            fontFamily: "Nunito_600SemiBold",
                                        }}
                                    >
                                        Nhận xét
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {activeButton === "About" && (
                                <View
                                    style={{
                                        marginHorizontal: 16,
                                        marginVertical: 25,
                                    }}
                                >
                                    <Text style={{ fontSize: 18, fontFamily: "Raleway_700Bold" }}>
                                        Thông tin khóa học
                                    </Text>
                                    <Text
                                        style={{
                                            color: "#525258",
                                            fontSize: 16,
                                            marginTop: 10,
                                            textAlign: "justify",
                                            fontFamily: "Nunito_500Medium",
                                        }}
                                    >
                                        {isExpanded
                                            ? courseData?.description
                                            : courseData?.description.slice(0, 302)}
                                    </Text>
                                    {courseData?.description.length > 302 && (
                                        <TouchableOpacity
                                            style={{ marginTop: 3 }}
                                            onPress={() => setIsExpanded(!isExpanded)}
                                        >
                                            <Text
                                                style={{
                                                    color: "#2467EC",
                                                    fontSize: 14,
                                                }}
                                            >
                                                {isExpanded ? "Show Less" : "Show More"}
                                                {isExpanded ? "-" : "+"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            {activeButton === "Lessons" && (
                                <View style={{ marginVertical: 25 }}>
                                    <CourseLesson key={"number-1"} courseDetails={courseData} />
                                </View>
                            )}
                            {activeButton === "Reviews" && (
                                <View style={{ marginVertical: 25 }}>
                                    <View style={{ rowGap: 25 }}>
                                        {courseInfo?.reviews?.map(
                                            (item: ReviewType, index: number) => (
                                                <View key={`${index}-baa`}>
                                                    <ReviewCard item={item} key={`${index}-gagagw`}/>
                                                </View>
                                            )
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <View
                        style={{
                            backgroundColor: "#FFFF",
                            marginHorizontal: 16,
                            paddingVertical: 11,
                            marginBottom: 10
                        }}
                    >
                        {checkPurchased === true ? (
                            <TouchableOpacity
                                style={{ backgroundColor: "#2467EC", paddingVertical: 16, borderRadius: 4 }}
                                onPress={() => router.push({
                                    pathname: "/(routes)/course-access",
                                    params: { courseData: JSON.stringify(courseData), courseId: courseData._id }
                                })}
                            >
                                <Text
                                    style={{ textAlign: "center", color: "#FFFF", fontSize: 16, fontFamily: "Nunito_600SemiBold" }}
                                >
                                    Di chuyển đến khóa học
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: "#2467EC",
                                    paddingVertical: 16,
                                    borderRadius: 4
                                }}
                                onPress={() => OnHandleAddToCart()}
                            >
                                <Text
                                    style={{
                                        textAlign: "center",
                                        color: "#FFFF",
                                        fontSize: 16,
                                        fontFamily: "Nunito_600SemiBold"
                                    }}
                                >
                                    Thêm vào giỏ
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    video: {
        width: "100%",
        height: 200,

    },
    engine: {
        position: 'absolute',
        right: 0,
    },
    body: {
        backgroundColor: Colors.white,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
});
export default CourseDetailsScreen;