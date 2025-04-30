import AllCourses from "@/components/all-courses";
import HeaderComponent from "@/components/header";
import HomeBannerSlider from "@/components/home-banner-slider";
import MentorList from "@/components/mentor-list";
import SearchInput from "@/components/search.input";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway";
import { Nunito_600SemiBold, Nunito_500Medium } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

const HomeScreen = () => {
    let [fontsLoaded, fontError] = useFonts({
        Raleway_700Bold,
        Raleway_600SemiBold,
        Nunito_600SemiBold,
        Nunito_500Medium,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <HeaderComponent />
            <SearchInput homeScreen={true} />
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
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
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <AllCourses displayMode="horizontal" category="recommended" limit={5} hideViewAll={true} />
                </View>
            </ScrollView>
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