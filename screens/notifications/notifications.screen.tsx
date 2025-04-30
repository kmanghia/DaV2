import { URL_IMAGES, URL_SERVER } from "@/utils/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, FlatList, RefreshControl, SafeAreaView, Platform, Alert } from "react-native";
import { useFonts } from "expo-font";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import io from "socket.io-client";

interface NotificationType {
    _id: string;
    title: string;
    message: string;
    status: string;
    type: string;
    link: string;
    courseId?: string;
    createdAt: string;
}

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [newNotification, setNewNotification] = useState<NotificationType | null>(null);
    const socketRef = useRef<any>(null);
    const [socketConnected, setSocketConnected] = useState(false);

    let [fontsLoaded, fontsError] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Raleway_600SemiBold,
        Raleway_700Bold,
    });

    // Setup socket connection
    useEffect(() => {
        const setupSocket = async () => {
            try {
                const user = await AsyncStorage.getItem('user_id');
                setUserId(user);
                
                if (!user) {
                    console.log("No user ID found for socket authentication");
                    return;
                }
                
                // Remove api/v1 from URL server for socket connection
                const socketUrl = URL_SERVER.replace('/api/v1', '');
                
                if (!socketUrl.startsWith('http')) {
                    console.log("Invalid socket URL");
                    return;
                }
                
                // Create socket connection
                socketRef.current = io(socketUrl, {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    timeout: 10000
                });
                
                // Connect and authenticate
                socketRef.current.on('connect', () => {
                    console.log("Socket connected with ID:", socketRef.current.id);
                    setSocketConnected(true);
                    
                    // Authenticate with user ID
                    socketRef.current.emit('authenticate', {
                        userId: user,
                        clientType: 'mobile',
                        clientId: `mobile_${Platform.OS}_${Date.now()}`,
                        userRole: 'user'
                    });
                    
                    console.log("Socket authenticated for user:", user);
                });
                
                // Handle both event names for backward compatibility
                socketRef.current.on('newNotification', (data: NotificationType) => {
                    console.log("Received new notification:", data.title);
                    handleNewNotification(data);
                });
                
                socketRef.current.on('new_notification', (data: NotificationType) => {
                    console.log("Received new_notification:", data.title);
                    handleNewNotification(data);
                });
                
                socketRef.current.on('connect_error', (error: any) => {
                    console.log("Socket connection error:", error.message);
                    setSocketConnected(false);
                });
                
                socketRef.current.on('disconnect', () => {
                    console.log("Socket disconnected");
                    setSocketConnected(false);
                });
            } catch (error) {
                console.log("Error setting up socket:", error);
            }
        };
        
        setupSocket();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);
    
    // Handle incoming notifications
    const handleNewNotification = (notification: NotificationType) => {
        // Add notification to state if it's not already there
        setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.some(item => item._id === notification._id);
            if (exists) return prev;
            
            // Add new notification at the beginning
            return [notification, ...prev];
        });
        
        // Display notification alert
        setNewNotification(notification);
        
        // Show alert for the new notification
        if (Platform.OS !== 'web') {
            Alert.alert(
                notification.title,
                notification.message,
                [{ text: 'OK', onPress: () => setNewNotification(null) }]
            );
        }
    };

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
            console.log("Fetched notifications:", response.data.notifications.length);
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

    const getNotificationBgColor = (type: string) => {
        switch (type) {
            case "purchase": return "#ECF3FF";
            case "update": return "#FFF8EC";
            case "review": return "#FFFCEB";
            case "discussion": return "#ECFFEF";
            case "course": return "#F8ECFF";
            default: return "#ECF3FF";
        }
    };

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    const unreadCount = notifications.filter(n => n.status === "unread").length;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <AntDesign name="arrowleft" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Thông báo</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <MaterialIcons 
                        name="refresh" 
                        size={24} 
                        color="#2467EC" 
                    />
                </TouchableOpacity>
            </View>
            
            {/* Socket connection indicator */}
            <View style={[
                styles.socketIndicator, 
                {backgroundColor: socketConnected ? "#4CAF50" : "#F44336"}
            ]}>
                <Text style={styles.socketIndicatorText}>
                    {socketConnected ? "Realtime đang hoạt động" : "Đang kết nối lại..."}
                </Text>
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
                        <View style={[
                            styles.iconContainer,
                            {backgroundColor: getNotificationBgColor(item.type)}
                        ]}>
                            {getNotificationIcon(item.type)}
                        </View>
                        <View style={styles.contentContainer}>
                            <Text style={styles.notificationTitle}>{item.title}</Text>
                            <Text style={styles.notificationMessage}>{item.message}</Text>
                            <Text style={styles.notificationTime}>{getTimeAgo(item.createdAt)}</Text>
                        </View>
                        {item.status === "unread" && (
                            <View style={styles.unreadIndicator} />
                        )}
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
        marginTop: 30
    },
    backButton: {
        padding: 8,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Raleway_700Bold",
        color: "#333333",
    },
    badgeContainer: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 5,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },
    refreshButton: {
        padding: 8,
    },
    socketIndicator: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socketIndicatorText: {
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        color: '#FFFFFF',
    },
    notificationItem: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        position: 'relative',
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
    unreadIndicator: {
        position: 'absolute',
        top: 18,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2467EC',
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