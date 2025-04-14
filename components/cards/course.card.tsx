import { AntDesign, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import * as userActions from "../../utils/store/actions/index";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { URL_IMAGES, URL_SERVER } from "@/utils/url";

interface CourseCardProps {
    item: CoursesType;
    isHorizontal?: boolean;
}

export default function CourseCard({ item, isHorizontal = false }: CourseCardProps) {
    const [showProgress, setShowProgress] = useState(false);
    const [progressFill, setProgressFill] = useState(0);
    const progresses = useSelector((state: any) => state.user.progress);
    const [wishState, setWishState] = useState(false);
    const wishList = useSelector((state: any) => state.user.wishList);
    const [idWishCourse, setIdWishCourse] = useState('');
    const dispatch = useDispatch();
    
    // Animation
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const isWished = wishList.find((_item: any) => _item.courseId === item._id);
        if(isWished){
            setWishState(true);
            setIdWishCourse(isWished._id);
        }else{
            setWishState(false);
            setIdWishCourse('');
        }
    }, [wishList])

    useEffect(() => {
        checkPurchasedCourse();
    }, [progresses])

    const checkPurchasedCourse = () => {
        let purchased = progresses.length > 0 && progresses.find((pro: any) => pro.courseId === item._id);
        if(purchased){
            setShowProgress(true);
            calculateProgressBar();
        }
    }

    const calculateProgressBar = () => {
        let progress = progresses.find((pro: any) => pro.courseId === item._id);
        let progressBarValue = progress.progress;
        setProgressFill(progressBarValue);
    }

    const getProgressColor = () => {
        let progress: number = progressFill;//chi lay tu 0-1
        return progress < 0.5 ? '#1c86b7' : '#237867';
    }

    const onAddToWishList = async () => {
        try {
            // Animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
            
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.post(`${URL_SERVER}/wishlist`, {
                courseId: item._id
            }, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const data = {
                _id: response.data.data._id,
                userId: response.data.userId,
                courseId: item._id
            }
            dispatch(userActions.pushWishCourse(data));
        } catch (error) {
            console.log(error);
        }
    }

    const onRemoveFromWishList = async () => {
        try {
            // Animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
            
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            await axios.delete(`${URL_SERVER}/wishlist?id=${idWishCourse}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const data = {
                _id: idWishCourse,
            }
            dispatch(userActions.removeWishCourse(data));
            setWishState(false);
        } catch (error) {
            console.log(error);
        }
    }

    if (isHorizontal) {
        return (
            <TouchableOpacity
                style={styles.horizontalContainer}
                onPress={() =>
                    router.push({
                        pathname: "/(routes)/course-details",
                        params: { item: JSON.stringify(item), courseId: item?._id },
                    })
                }
            >
                <View style={styles.horizontalImageContainer}>
                    <Image
                        style={styles.horizontalImage}
                        source={{ uri: item.thumbnail.url ? `${URL_IMAGES}/${item.thumbnail.url}` : `${URL_IMAGES}/${item.thumbnail}`}}
                    />
                    <View style={styles.wishBtnContainer}>
                        {!wishState ? (
                            <TouchableOpacity
                                onPress={() => onAddToWishList()}
                                style={styles.wishBtn}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <AntDesign name="hearto" size={15} color="#FF385C" style={styles.heartIcon} />
                                </Animated.View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => onRemoveFromWishList()}
                                style={styles.wishBtn}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <AntDesign name="heart" size={15} color="#FF385C" style={styles.heartIcon} />
                                </Animated.View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <View style={styles.horizontalContentContainer}>
                    <View style={styles.titleContainer}>
                        <Text numberOfLines={2} style={styles.horizontalTitle}>{item.name}</Text>
                    </View>
                    
                    <View style={styles.metaContainer}>
                        <View style={styles.ratingBadge}>
                            <FontAwesome name="star" size={12} color={"#ffb800"} />
                            <Text style={styles.smallRatingText}>{item?.ratings?.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.horizontalStudents}>
                            {item.purchased} <FontAwesome5 name="user" size={12} color="#666" />
                        </Text>
                    </View>

                    <View style={styles.lessonInfo}>
                        <Ionicons name="list-outline" size={14} color={"#8A8A8A"} />
                        <Text style={styles.horizontalLessons}>
                            {item.courseData.length} bài học
                        </Text>
                    </View>

                    {showProgress ? (
                        <View style={styles.progressContainer}>
                            <Progress.Bar 
                                progress={progressFill}
                                width={null}
                                height={4}
                                color={getProgressColor()}
                            />
                            <Text style={{...styles.progressText, color: getProgressColor()}}>
                                {Math.round(progressFill * 100)}%
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.horizontalPriceContainer}>
                            <Text style={styles.price}>{item?.price.toLocaleString()}đ</Text>
                            <Text style={styles.estimatedPrice}>{item?.estimatedPrice?.toLocaleString()}đ</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.container, { marginHorizontal: "auto" }]}
            onPress={() =>
                router.push({
                    pathname: "/(routes)/course-details",
                    params: { item: JSON.stringify(item), courseId: item?._id },
                })
            }
        >
            <View style={{ paddingHorizontal: 10, marginHorizontal: "auto", position: 'relative' }}>
                <Image
                    style={{
                        width: wp(80),
                        height: 200,
                        borderRadius: 5,
                        alignSelf: "center",
                        objectFit: "cover",
                    }}
                    source={{ uri: item.thumbnail.url ? `${URL_IMAGES}/${item.thumbnail.url}` : `${URL_IMAGES}/${item.thumbnail}`}}
                />
                <View 
                    style={{
                        position:'absolute',
                        zIndex: 9999,
                        top: 10,
                        right: 10
                    }}
                >
                    {!wishState ? (
                        <TouchableOpacity
                            onPress={() => onAddToWishList()}
                            style={styles.wishBtn}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <AntDesign name="hearto" size={15} color="#FF385C" style={styles.heartIcon} />
                            </Animated.View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => onRemoveFromWishList()}
                            style={styles.wishBtn}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <AntDesign name="heart" size={15} color="#FF385C" style={styles.heartIcon} />
                            </Animated.View>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{ width: wp(80) }}>
                    <Text
                        style={{
                            fontSize: 14,
                            textAlign: "left",
                            marginTop: 10,
                            
                            fontFamily: "Raleway_600SemiBold",
                        }}
                    >
                        {item.name}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#141517",
                            padding: 4,
                            borderRadius: 5,
                            gap: 4,
                            paddingHorizontal: 10,
                            height: 28,
                            marginTop: 10,
                        }}
                    >
                        <FontAwesome name="star" size={14} color={"#ffb800"} />
                        <Text style={[styles.ratingText]}>{item?.ratings?.toFixed(1)}</Text>
                    </View>
                    <Text>{item.purchased} <FontAwesome5 name="user" size={14} color="black" /></Text>
                </View>
                { showProgress ? (
                    <View style={{gap: 4, paddingTop: 10}}>
                        <Progress.Bar 
                            progress={progressFill}
                            width={wp(80)}
                            color={getProgressColor()}
                        />
                        <Text 
                            style={{
                                color: getProgressColor()
                            }}
                        >
                            Hoàn thành {Math.round(progressFill * 100)}%
                        </Text>
                    </View>
                ):(
                    <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 5,
                    }}
                    >
                        <View style={{ flexDirection: "row" }}>
                            <Text style={{ paddingTop: 10, fontSize: 18, fontWeight: "600" }}>
                                {item?.price?.toLocaleString()}đ
                            </Text>
                            <Text
                                style={{
                                    paddingLeft: 5,
                                    textDecorationLine: "line-through",
                                    fontSize: 16,
                                    fontWeight: "400",
                                }}
                            >
                                {item?.estimatedPrice?.toLocaleString()}đ
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Ionicons name="list-outline" size={20} color={"#8A8A8A"} />
                            <Text style={{ marginLeft: 5 }}>
                                {item.courseData.length} Bài học
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFF",
        marginHorizontal: 6,
        borderRadius: 12,
        width: "100%",
        height: "auto",
        overflow: "hidden",
        margin: "auto",
        marginVertical: 15,
        padding: 8
    },
    ratingText: {
        color: "white",
        fontSize: 14,
    },
    wishBtn: {
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    heartIcon: {
        fontSize: 16
    },
    
    // Horizontal styles
    horizontalContainer: {
        width: "100%",
        
        backgroundColor: "#FFFF",
        borderRadius: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
       
    },
    horizontalImageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 16/9,
        backgroundColor: '#f5f5f5',
    },
    horizontalImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    horizontalContentContainer: {
        padding: 12,
        height: 150,
    },
    titleContainer: {
        marginBottom: 8,
        minHeight: 40,
    },
    horizontalTitle: {
        fontSize: 13,
        fontFamily: "Raleway_600SemiBold",
        lineHeight: 18,
        color: "#000",
    },
    metaContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.07)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
    },
    smallRatingText: {
        color: "#000",
        fontSize: 11,
        fontFamily: "Raleway_600SemiBold",
    },
    horizontalStudents: {
        fontSize: 11,
        color: "#666",
        fontFamily: "Raleway_600SemiBold",
    },
    lessonInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    horizontalLessons: {
        fontSize: 11,
        color: "#666",
        marginLeft: 4,
        fontFamily: "Raleway_600SemiBold",
    },
    progressContainer: {
        marginTop: 4,
    },
    progressText: {
        fontSize: 11,
        marginTop: 2,
        fontFamily: "Raleway_600SemiBold",
    },
    horizontalPriceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        fontFamily: "Raleway_600SemiBold",
    },
    estimatedPrice: {
        fontSize: 12,
        marginLeft: 6,
        textDecorationLine: "line-through",
        color: "#999",
        fontFamily: "Raleway_600SemiBold",
    },
    wishBtnContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
    },
});