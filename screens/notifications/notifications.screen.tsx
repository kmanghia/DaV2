import { URL_SERVER } from "@/utils/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, FlatList, RefreshControl, SafeAreaView } from "react-native";
import { useFonts } from "expo-font";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationType {
    _id: string;
    title: string;
    message: string;
    status: string;
    type: string;
    link: string;
    courseId: string;
    createdAt: string;
}

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    let [fontsLoaded, fontsError] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Raleway_600SemiBold,
        Raleway_700Bold,
    });

    const fetchNotifications = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            const response = await axios.get(`${URL_SERVER}/user-notifications`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            setNotifications(response.data.notifications);
        } catch (error) {
            console.log("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            
            await axios.put(`${URL_SERVER}/update-notification/${notificationId}`, {}, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            
            // Update local state
            setNotifications(prevNotifications => 
                prevNotifications.map(notification => 
                    notification._id === notificationId 
                        ? { ...notification, status: "read" } 
                        : notification
                )
            );
        } catch (error) {
            console.log("Error marking notification as read:", error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "purchase":
                return <Ionicons name="cart" size={24} color="#2467EC" />;
            case "update":
                return <Feather name="refresh-cw" size={24} color="#FFA500" />;
            case "review":
                return <Ionicons name="star" size={24} color="#FFD700" />;
            case "discussion":
                return <Ionicons name="chatbubble-ellipses" size={24} color="#4CAF50" />;
            case "course":
                return <Ionicons name="book" size={24} color="#9C27B0" />;
            default:
                return <Ionicons name="notifications" size={24} color="#2467EC" />;
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { 
                addSuffix: true,
                locale: vi
            });
        } catch (error) {
            return "Vừa xong";
        }
    };

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <AntDesign name="arrowleft" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <View style={{ width: 24 }} />
            </View>
            
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[
                            styles.notificationItem, 
                            item.status === "unread" && styles.unreadItem
                        ]}
                        onPress={() => markAsRead(item._id)}
                    >
                        <View style={styles.iconContainer}>
                            {getNotificationIcon(item.type)}
                        </View>
                        <View style={styles.contentContainer}>
                            <Text style={styles.notificationTitle}>{item.title}</Text>
                            <Text style={styles.notificationMessage}>{item.message}</Text>
                            <Text style={styles.notificationTime}>{getTimeAgo(item.createdAt)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#2467EC"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Feather name="bell-off" size={60} color="#CCCCCC" />
                        <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
                    </View>
                }
                contentContainerStyle={notifications.length === 0 && { flex: 1, justifyContent: 'center' }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Raleway_700Bold",
        color: "#333333",
    },
    notificationItem: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    unreadItem: {
        backgroundColor: "#F5F8FF",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F0F4FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: "#333333",
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        fontFamily: "Nunito_400Regular",
        color: "#666666",
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 12,
        fontFamily: "Nunito_400Regular",
        color: "#999999",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "Nunito_500Medium",
        color: "#999999",
        marginTop: 16,
        textAlign: "center",
    },
});

export default NotificationsScreen; 