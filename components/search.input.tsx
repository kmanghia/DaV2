import { URL_IMAGE, URL_IMAGES, URL_SERVER } from "@/utils/url";
import { Nunito_700Bold } from "@expo-google-fonts/nunito";
import { AntDesign, Feather } from "@expo/vector-icons";
import axios from "axios";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import CourseCard from "./cards/course.card";

const styles = StyleSheet.create({
    filteringContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginBottom: 8,
    },

    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        height: 50,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },

    searchIconContainer: {
        width: 38,
        height: 38,
        backgroundColor: "#2467EC",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        shadowColor: "#2467EC",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: "#333",
        paddingVertical: 10,
        width: 271,
        height: 48,
    },
    
    resultsContainer: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 999,
        backgroundColor: "white",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        maxHeight: 300,
    },
    
    courseItem: {
        backgroundColor: "#fff",
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    
    courseImage: {
        width: 60, 
        height: 60, 
        borderRadius: 8,
        backgroundColor: "#f5f5f5",  // Placeholder background
    },
    
    courseInfo: {
        flexDirection: "column",
        paddingLeft: 15,
        gap: 6,
        flex: 1,
    },
    
    courseName: {
        fontSize: 14,
        fontFamily: "Nunito_700Bold",
        color: "#333",
    },
    
    courseTags: {
        fontSize: 12,
        color: "#666",
    },
    
    coursePrice: {
        fontSize: 13,
        fontFamily: "Nunito_700Bold",
        color: "#2467EC",
        marginTop: 2,
    },
    
    emptyResults: {
        padding: 20,
        textAlign: "center",
        color: "#666",
    },
    
    resultHeader: {
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    
    resultHeaderText: {
        fontSize: 12,
        color: "#666",
        fontFamily: "Nunito_700Bold",
    },
    
    viewAllButton: {
        padding: 12,
        backgroundColor: "#f9f9f9",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    viewAllButtonText: {
        color: "#2467EC",
        fontFamily: "Nunito_700Bold",
        fontSize: 14,
    },
});

const SearchInput = ({ homeScreen }: { homeScreen?: boolean }) => {
    const [value, setValue] = useState("");
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CoursesType | null>(null);

    useEffect(() => {
        loadAllCourses();
    }, []);

    const loadAllCourses = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setCourses(response.data.courses);
            if (!homeScreen) {
                setFilteredCourses(response.data.courses);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (homeScreen && value === "") {
            setFilteredCourses([]);
        } else if (value) {
            setIsLoading(true);
            // Thêm thời gian trễ nhỏ để tránh quá nhiều yêu cầu liên tục
            const timeoutId = setTimeout(() => {
                const filtered = courses.filter((course: CoursesType) => course.name.toLowerCase().includes(value.toLowerCase()));
                setFilteredCourses(filtered);
                setIsLoading(false);
            }, 300);
            
            return () => clearTimeout(timeoutId);
        } else if (!homeScreen) {
            setFilteredCourses(courses);
        }
    }, [value, courses])

    let [fontsLoaded, fontError] = useFonts({
        Nunito_700Bold,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const handleCoursePress = (item: CoursesType) => {
        console.log("Course selected:", item);
        setSelectedCourse(item);
        Keyboard.dismiss();
        setValue("");
        setIsSearchFocused(false);
    };

    useEffect(() => {
        if (selectedCourse) {
            // Điều hướng sau khi đã ẩn bàn phím và cập nhật trạng thái
            router.push({
                pathname: "/(routes)/course-details",
                params: { 
                    item: JSON.stringify(selectedCourse),
                    courseId: selectedCourse._id 
                }
            });
            setSelectedCourse(null);
        }
    }, [selectedCourse]);

    const renderCourseItem = ({ item }: { item: CoursesType }) => {
        // Kiểm tra cấu trúc dữ liệu để đảm bảo hiển thị hình ảnh đúng
        const imageUrl = item.thumbnail.url ? item.thumbnail.url : null;
        console.log(imageUrl);
        
        return (
            <TouchableOpacity
                style={styles.courseItem}
                activeOpacity={0.7}
                onPress={() => handleCoursePress(item)}
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: `${URL_IMAGES}/${item.thumbnail?.url}` }}
                        style={styles.courseImage}
                    />
                ) : (
                    <View style={[styles.courseImage, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                        <Feather name="image" size={24} color="#999" />
                    </View>
                )}
                <View style={styles.courseInfo}>
                    <Text style={styles.courseName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.courseTags} numberOfLines={1}>
                        {item.tags}
                    </Text>
                    {item.price && (
                        <Text style={styles.coursePrice}>
                            {item.price.toLocaleString()} đ
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.filteringContainer}>
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={20} color="#C67CCC" style={{ marginRight: 8 }} />
                        <TextInput
                            style={[styles.input, { fontFamily: 'Nunito_700Bold' }]}
                            placeholder="Tìm kiếm khóa học"
                            onChangeText={(v) => setValue(v)}
                            placeholderTextColor={"#C67CCC"}
                            value={value}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                        />
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#2467EC" style={{ marginRight: 8 }} />
                        ) : value ? (
                            <TouchableOpacity onPress={() => setValue("")}>
                                <Feather name="x" size={20} color="#999" />
                            </TouchableOpacity>
                        ) : homeScreen ? (
                            <TouchableOpacity
                                style={styles.searchIconContainer}
                                onPress={() => router.push("/(tabs)/search")}
                            >
                                <AntDesign name="arrowright" size={20} color={"#fff"} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </TouchableWithoutFeedback>
            
            {homeScreen && filteredCourses.length > 0 && isSearchFocused && (
                <View style={styles.resultsContainer}>
                    <View style={styles.resultHeader}>
                        <Text style={styles.resultHeaderText}>
                            {filteredCourses.length} kết quả tìm kiếm
                        </Text>
                    </View>
                    <FlatList
                        data={filteredCourses.slice(0, 5)}
                        keyExtractor={(item: CoursesType) => item._id}
                        renderItem={renderCourseItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 4 }}
                    />
                    {filteredCourses.length > 5 && (
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => {
                                router.push({
                                    pathname: "/(tabs)/search",
                                    params: { query: value }
                                });
                                setValue("");
                                setIsSearchFocused(false);
                            }}
                        >
                            <Text style={styles.viewAllButtonText}>
                                Xem tất cả {filteredCourses.length} kết quả
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            
            {!homeScreen && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        style={{
                            width: widthPercentageToDP("90%"),
                            marginLeft: 20,
                            marginRight: 20,
                        }}
                        data={filteredCourses}
                        keyExtractor={(item: CoursesType) => item._id}
                        renderItem={({ item }) => <CourseCard item={item} key={item._id} />}
                        ListEmptyComponent={
                            <Text style={styles.emptyResults}>
                                Không tồn tại dữ liệu để hiển thị!
                            </Text>
                        }
                    />
                </View>
            )}
        </View>
    )
}

export default SearchInput;