import { URL_IMAGES, URL_SERVER } from "@/utils/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View, StyleSheet, SafeAreaView } from "react-native"
import AccountConfirmation from "@/assets/images/account_confirmation.png";
import EmptyCart from "@/assets/images/empty_cart.png";
import { Toast } from "react-native-toast-notifications";
import { useDispatch } from "react-redux";
import * as userActions from "../../utils/store/actions"; 
import React from "react";
import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";

const CartScreen = () => {
    const navigation = useNavigation();
    const [cartItems, setCartItems] = useState<CoursesType[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const dispatch = useDispatch();
    
    let [fontsLoaded, fontsError] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Raleway_600SemiBold,
        Raleway_700Bold,
    });

    const FetchCartUser = async () => {
        try {
            const cart: any = await AsyncStorage.getItem("cart");
            setCartItems(JSON.parse(cart));
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        FetchCartUser();
    }, [])

    const OnRefresh = async () => {
        setRefreshing(true);
        const cart: any = await AsyncStorage.getItem("cart");
        try {
            setCartItems(cart ? JSON.parse(cart) : []);
        } catch (error) {
            console.log("Error parsing cart data:", error);
            setCartItems([]);
        }
        setRefreshing(false);
    }

    const CalculateTotalPrice = () => {
        if (!Array.isArray(cartItems)) return 0;
        
        const totalPrice = cartItems.reduce(
            (total, item) => total + item.price,
            0
        );
        return totalPrice;
    }

    const OnHandleCourseDetails = (courseDetails: any) => {
        router.push({
            pathname: "/(routes)/course-details",
            params: { item: JSON.stringify(courseDetails) }
        })
    }

    const OnHandleRemoveItem = async (item: any) => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const existingCartData = await AsyncStorage.getItem("cart");
            const cartData = existingCartData ? JSON.parse(existingCartData) : [];
            const updatedCartData = cartData.filter((i: any) => i._id !== item._id);
            await AsyncStorage.setItem("cart", JSON.stringify(updatedCartData));
            setCartItems(updatedCartData);
            const response = await axios.put(`${URL_SERVER}/delete-course`, item, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            Toast.show(response.data.message, {
                type: 'success'
            })
        } catch (error: any) {
            console.log(error.message);
        }
    }

    const OnHandlePayment = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const amount = Math.round(
                Array.isArray(cartItems) 
                    ? cartItems.reduce((total, item) => total + item.price, 0)
                    : 0
            );
            const paymentIntentResponse = await axios.post(
                `${URL_SERVER}/payment`,
                { amount },
                {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                }
            );
            const { client_secret: clientSecret } = paymentIntentResponse.data;
            const initSheetResponse = await initPaymentSheet({
                merchantDisplayName: "Duy Nghia",
                paymentIntentClientSecret: clientSecret,
                customFlow: false,
                style: 'automatic',
                defaultBillingDetails: {
                  address: {
                    country: 'VN', // Set country to Vietnam
                  }
                },
            });
            if (initSheetResponse.error) {
                console.error(initSheetResponse.error);
                return;
            }
            const paymentResponse = await presentPaymentSheet();
            if (paymentResponse.error) {
                console.error(paymentResponse.error);
            } else {
                await CreateOrder(paymentResponse);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const CreateOrder = async (paymentResponse: any) => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            let currCart: CoursesType[] = cartItems;
            let paymentOrders: { _id: string }[] = [];
            currCart.forEach(async (course) => {
                paymentOrders.push({ _id: course._id });
                await axios.post(`${URL_SERVER}/create-mobile-order`, {
                    courseId: course._id,
                    payment_info: paymentResponse
                }, {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                });
                await axios.put(`${URL_SERVER}/delete-course`, course, {
                    headers: {
                        'access-token': accessToken,
                        'refresh-token': refreshToken
                    }
                })

                let payload = {
                    courseId: course._id,
                    progress: 0,
                    name: course.name,
                    total: course.courseData.length,
                }
                dispatch(userActions.pushProgressOfUser(payload));
            })
            setOrderSuccess(true);
            currCart = [];
            await AsyncStorage.setItem("paymented", JSON.stringify(paymentOrders));
            await AsyncStorage.setItem("cart", JSON.stringify(currCart));
            
            // Refresh courses để cập nhật số lượng purchased
            try {
                // Cố gắng truy cập refreshCourses từ HomeScreen
                // @ts-ignore
                const homeScreen = navigation.getParent()?.getState().routes.find(route => route.name === 'home');
                if (homeScreen && homeScreen.params && homeScreen.params.refreshCourses) {
                    // @ts-ignore
                    homeScreen.params.refreshCourses();
                }
                
                // Hoặc gọi API trực tiếp để lấy dữ liệu cập nhật
                const response = await axios.get(`${URL_SERVER}/get-courses`);
                const updatedCourses = response.data.courses;
                
                // Có thể update vào một global state nếu cần
                // dispatch(userActions.updateCourses(updatedCourses));
            } catch (error) {
                console.log("Không thể refresh courses:", error);
            }
        } catch (error) {
            console.log(error);
        }
    };

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            {orderSuccess ? (
                <View style={styles.successContainer}>
                    <View style={styles.successImageContainer}>
                        <Image
                            source={AccountConfirmation}
                            style={styles.successImage}
                        />
                    </View>
                    
                    <View style={styles.successTextContainer}>
                        <Text style={styles.successTitle}>
                            Thanh toán thành công
                        </Text>
                        <Text style={styles.successMessage}>
                            Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của chúng tôi!
                        </Text>
                    </View>
                    
                    <View style={styles.emailNoticeContainer}>
                        <MaterialIcons name="email" size={24} color="#2467EC" style={styles.emailIcon} />
                        <Text style={styles.emailNotice}>
                            Bạn sẽ sớm nhận được một email của chúng tôi!
                        </Text>
                    </View>
                    
                    <TouchableOpacity
                        onPress={() => {
                            // Sau khi thanh toán, quay lại màn hình home để thấy khóa học mới
                            router.replace("/(tabs)");
                        }}
                        style={styles.homeButton}
                    >
                        <Text style={styles.homeButtonText}>Quay về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
                        <Text style={styles.itemCount}>{cartItems?.length || 0} khóa học</Text>
                    </View>
                    
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item._id + ""}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => (
                            <View style={styles.cartItem}>
                                <TouchableOpacity 
                                    style={styles.imageContainer}
                                    onPress={() => OnHandleCourseDetails(item)}
                                >
                                    <Image
                                        source={{ uri: item.thumbnail.url ? `${URL_IMAGES}/${item.thumbnail.url}` : `${URL_IMAGES}/${item.thumbnail}`}}
                                        style={styles.itemImage}
                                    />
                                </TouchableOpacity>
                                
                                <View style={styles.itemContent}>
                                    <TouchableOpacity onPress={() => OnHandleCourseDetails(item)}>
                                        <Text style={styles.itemTitle} numberOfLines={2}>
                                            {item?.name}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.itemDetails}>
                                        <View style={styles.levelContainer}>
                                            <Ionicons name="bar-chart-outline" size={14} color="#757575" />
                                            <Text style={styles.levelText}>{item.level}</Text>
                                        </View>
                                        
                                        <View style={styles.lessonContainer}>
                                            <Feather name="book-open" size={14} color="#757575" />
                                            <Text style={styles.lessonText}>
                                                {item.courseData.length} bài học
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.priceAndRemove}>
                                        <Text style={styles.priceText}>
                                            {item.price.toLocaleString()}đ
                                        </Text>
                                        
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => OnHandleRemoveItem(item)}
                                        >
                                            <Feather name="trash-2" size={16} color="#FFF" />
                                            <Text style={styles.removeText}>Xóa</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyCartContainer}>
                                <Image
                                    source={EmptyCart}
                                    style={styles.emptyCartImage}
                                />
                                <Text style={styles.emptyCartTitle}>
                                    Giỏ hàng của bạn đang trống!
                                </Text>
                                <Text style={styles.emptyCartDescription}>
                                    Hãy thêm các khóa học bạn yêu thích vào giỏ hàng
                                </Text>
                                <TouchableOpacity
                                    style={styles.exploreButton}
                                    onPress={() => router.push("/(tabs)")}
                                >
                                    <Text style={styles.exploreButtonText}>Khám phá các khóa học</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => OnRefresh()} />
                        }
                    />
                    
                    {cartItems?.length > 0 && (
                        <View style={styles.checkoutContainer}>
                            <View style={styles.totalPriceContainer}>
                                <Text style={styles.totalLabel}>Thành tiền:</Text>
                                <Text style={styles.totalPrice}>{CalculateTotalPrice().toLocaleString()}đ</Text>
                            </View>
                            
                            <TouchableOpacity
                                style={styles.checkoutButton}
                                onPress={() => OnHandlePayment()}
                            >
                                <AntDesign name="creditcard" size={18} color="#FFF" style={styles.cardIcon} />
                                <Text style={styles.checkoutText}>
                                    Tiến hành thanh toán
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Raleway_700Bold",
        color: "#333",
    },
    itemCount: {
        fontSize: 14,
        fontFamily: "Nunito_400Regular",
        color: "#757575",
        marginTop: 3,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
    },
    cartItem: {
        flexDirection: "row",
        marginBottom: 15,
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#FFF",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    imageContainer: {
        marginRight: 15,
        borderRadius: 10,
        overflow: "hidden",
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    itemContent: {
        flex: 1,
        justifyContent: "space-between",
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: "#333",
        marginBottom: 6,
    },
    itemDetails: {
        marginVertical: 5,
    },
    levelContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    levelText: {
        fontSize: 14,
        fontFamily: "Nunito_400Regular",
        color: "#757575",
        marginLeft: 5,
    },
    lessonContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    lessonText: {
        fontSize: 14,
        fontFamily: "Nunito_400Regular",
        color: "#757575",
        marginLeft: 5,
    },
    priceAndRemove: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    priceText: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: "#2467EC",
    },
    removeButton: {
        backgroundColor: "#FF6347",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    removeText: {
        color: "#FFF",
        fontSize: 14,
        fontFamily: "Nunito_600SemiBold",
        marginLeft: 5,
    },
    emptyCartContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
        marginTop: 40,
    },
    emptyCartImage: {
        width: 180,
        height: 180,
        resizeMode: "contain",
        marginBottom: 20,
    },
    emptyCartTitle: {
        fontSize: 20,
        fontFamily: "Raleway_700Bold",
        color: "#333",
        marginBottom: 10,
    },
    emptyCartDescription: {
        fontSize: 16,
        fontFamily: "Nunito_400Regular",
        color: "#757575",
        textAlign: "center",
        marginBottom: 25,
    },
    exploreButton: {
        backgroundColor: "#2467EC",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    exploreButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontFamily: "Nunito_600SemiBold",
    },
    checkoutContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFF",
        paddingVertical: 15,
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    totalPriceContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: "Nunito_600SemiBold",
        color: "#757575",
    },
    totalPrice: {
        fontSize: 20,
        fontFamily: "Nunito_700Bold",
        color: "#2467EC",
    },
    checkoutButton: {
        backgroundColor: "#2467EC",
        borderRadius: 10,
        padding: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    cardIcon: {
        marginRight: 8,
    },
    checkoutText: {
        color: "#FFF",
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        textAlign: "center",
    },
    // Success Screen Styles
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFF",
    },
    successImageContainer: {
        marginBottom: 25,
    },
    successImage: {
        width: 200,
        height: 200,
        resizeMode: "contain",
    },
    successTextContainer: {
        alignItems: "center",
        marginBottom: 25,
    },
    successTitle: {
        fontSize: 24,
        fontFamily: "Raleway_700Bold",
        color: "#2467EC",
        marginBottom: 10,
    },
    successMessage: {
        fontSize: 16,
        fontFamily: "Nunito_500Medium",
        color: "#555",
        textAlign: "center",
        lineHeight: 22,
    },
    emailNoticeContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
        backgroundColor: "#F0F7FF",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: "90%",
    },
    emailIcon: {
        marginRight: 10,
    },
    emailNotice: {
        fontSize: 15,
        fontFamily: "Nunito_500Medium",
        color: "#555",
    },
    homeButton: {
        backgroundColor: "#2467EC",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 10,
        elevation: 2,
        shadowColor: "#2467EC",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    homeButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
    },
});

export default CartScreen;