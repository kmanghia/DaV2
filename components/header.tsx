import useUser from "@/hooks/useUser";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useState } from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import UserImage from "@/assets/images/icons/User.png";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { URL_IMAGES, URL_SERVER } from "@/utils/url";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 16,
        width: "90%",
        paddingVertical: 8,
    },

    headerWrapper: {
        flexDirection: "row",
        alignItems: "center",
    },

    imageContainer: {
        borderRadius: 25,
        padding: 2,
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    userInfoContainer: {
        flexDirection: "column",
    },

    text: {
        fontSize: 16,
        fontWeight: "600",
    },

    bellButton: {
        marginTop: 0,
        borderWidth: 0,
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 24,
        backgroundColor: "#f5f5f5",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    bellIcon: {
        alignSelf: "center",
    },

    bellContainer: {
        width: 20,
        height: 20,
        backgroundColor: "#2467EC",
        position: "absolute",
        borderRadius: 10,
        right: -2,
        top: -2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "white",
    },

    helloText: { 
        color: "#7C7C80", 
        fontSize: 14,
        marginBottom: 2,
    },
    
    actionButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
})

const HeaderComponent = () => {
    const [cartItems, setCartItems] = useState([]);
    const [notifications, setNotifications] = useState([]);
    // const { user } = useUser();
    const [avatar, setAvatar] = useState('');
    const user = useSelector((state: any) => state.user);
    useFocusEffect(
        useCallback(() => {
            LoadCartItems();
            LoadNotifications();
        }, [])
    );

    useEffect(() => {
        setAvatar(user.userInfo.avatarUrl);
    }, [user]);

    const LoadCartItems = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const response = await axios.get(`${URL_SERVER}/get-cart`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            const cart = response.data.coursesInCart;
            await AsyncStorage.setItem("cart", JSON.stringify(cart));
            setCartItems(cart);
        } catch (error) {
            console.log(error);
        }
    }

    const LoadNotifications = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const response = await axios.get(`${URL_SERVER}/user-notifications`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            // Filter unread notifications
            const unreadNotifications = response.data.notifications.filter(
                (notification: any) => notification.status === "unread"
            );
            
            setNotifications(unreadNotifications);
        } catch (error) {
            console.log("Error loading notifications:", error);
        }
    }

    let [fontsLoaded, fontsError] = useFonts({
        Raleway_700Bold
    })

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                    <LinearGradient
                        colors={['#4e83f7', '#2467EC']}
                        style={styles.imageContainer}
                    >
                        <Image
                            style={styles.image}
                            source={{
                                uri: `${URL_IMAGES}/${avatar}`
                            }}
                        />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.userInfoContainer}>
                    <Text style={[styles.helloText, { fontFamily: "Raleway_700Bold" }]}>
                        Xin chào,
                    </Text>
                    <Text style={[styles.text, { fontFamily: "Raleway_700Bold" }]}>
                        {user.userInfo.name !== '' ? user.userInfo.name : "Người dùng ^^"}
                    </Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.bellButton}
                    onPress={() => router.push({
                        pathname: "/(routes)/notifications"
                    })}
                >
                    <Feather name="bell" size={24} color={"#2467EC"} />
                    {notifications.length > 0 && (
                        <View style={styles.bellContainer}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                                {notifications.length > 99 ? "99+" : notifications.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.bellButton}
                    onPress={() => router.push({
                        pathname: "/(routes)/cart"
                    })}
                >
                    <Feather name="shopping-bag" size={24} color={"#2467EC"} />
                    {cartItems?.length > 0 && (
                        <View style={styles.bellContainer}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                                {cartItems.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default HeaderComponent;