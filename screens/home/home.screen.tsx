import AllCourses from "@/components/all-courses";
import HeaderComponent from "@/components/header";
import HomeBannerSlider from "@/components/home-banner-slider";
import MentorList from "@/components/mentor-list";
import SearchInput from "@/components/search.input";
import ChatButton from "@/components/chat-button";
import ChatModal from "@/components/chat-modal";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway";
import { Nunito_600SemiBold, Nunito_500Medium } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

// This is a temporary ID - you should get the actual user ID from your auth system
const TEMP_USER_ID = "123456";

const HomeScreen = () => {
    const [isChatVisible, setIsChatVisible] = useState(false);
    const user = useSelector((state: any) => state.user);
    const scrollY = useRef(new Animated.Value(0)).current;
    
    let [fontsLoaded, fontError] = useFonts({
        Raleway_700Bold,
        Raleway_600SemiBold,
        Nunito_600SemiBold,
        Nunito_500Medium,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const toggleChat = () => {
        setIsChatVisible(!isChatVisible);
    };

    // Calculate header opacity and translateY based on scroll position
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, -100],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            {/* Apply animation to header */}
            <Animated.View style={{
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: '#FAFAFA'
            }}>
            <HeaderComponent />
            <SearchInput homeScreen={true} />
            </Animated.View>
            
            <Animated.ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingTop: 120 }]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                <HomeBannerSlider />
                
                {/* Mentors section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Giảng viên nổi bật</Text>
                            <Text style={styles.sectionSubtitle}>Chuyên gia hàng đầu trong lĩnh vực</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push("/(tabs)/search")}
                            style={styles.viewAllButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <MentorList />
                </View>
                
                {/* Khóa học mới section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Khóa học mới</Text>
                            <Text style={styles.sectionSubtitle}>Cập nhật những kiến thức mới nhất</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push("/(tabs)/search")}
                            style={styles.viewAllButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <AllCourses displayMode="horizontal" category="new" limit={5} hideViewAll={true} />
                </View>
                
                {/* Phổ biến section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Phổ biến nhất</Text>
                            <Text style={styles.sectionSubtitle}>Được nhiều học viên tin chọn</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push("/(tabs)/search")}
                            style={styles.viewAllButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <AllCourses displayMode="horizontal" category="popular" limit={5} hideViewAll={true} />
                </View>
                
                {/* Khóa học gợi ý section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Khóa học gợi ý</Text>
                            <Text style={styles.sectionSubtitle}>Dựa trên sở thích và hoạt động của bạn</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push("/(tabs)/search")}
                            style={styles.viewAllButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <AllCourses displayMode="horizontal" category="recommended" limit={5} hideViewAll={true} />
                </View>
            </Animated.ScrollView>
            
            {/* Chat Button and Modal with visibility prop */}
            <ChatButton onPress={toggleChat} visible={!isChatVisible} />
            <ChatModal 
                isVisible={isChatVisible} 
                onClose={toggleChat} 
                userId={user.userInfo._id} 
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    sectionContainer: {
        marginTop: 10,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Raleway_700Bold',
        color: '#000',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
        color: '#666',
    },
    viewAllButton: {
        paddingVertical: 4,
    },
    viewAllText: {
        fontSize: 15,
        color: '#2467EC',
        fontFamily: 'Nunito_600SemiBold',
    }
});

export default HomeScreen;