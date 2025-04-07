import { URL_SERVER } from "@/utils/url";
import { Nunito_700Bold } from "@expo-google-fonts/nunito";
import { AntDesign, Feather } from "@expo/vector-icons";
import axios from "axios";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useEffect, useState } from "react"
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    
    emptyResults: {
        padding: 20,
        textAlign: "center",
        color: "#666",
    }
});

const SearchInput = ({ homeScreen }: { homeScreen?: boolean }) => {
    const [value, setValue] = useState("");
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        loadAllCourses();
    }, []);

    const loadAllCourses = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setCourses(response.data.courses);
            if (!homeScreen) {
                setFilteredCourses(response.data.courses);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (homeScreen && value === "") {
            setFilteredCourses([]);
        } else if (value) {
            const filtered = courses.filter((course: CoursesType) => course.name.toLowerCase().includes(value.toLowerCase()));
            setFilteredCourses(filtered);
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

    const renderCourseItem = ({ item }: { item: CoursesType }) => (
        <TouchableOpacity
            style={styles.courseItem}
            onPress={() => {
                router.push({
                    pathname: "/(routes)/course-details",
                    params: { item: JSON.stringify(item) }
                });
                setValue("");
                setIsSearchFocused(false);
            }}
        >
            <Image
                source={{ uri: item.thumbnail.url }}
                style={styles.courseImage}
            />
            <View style={styles.courseInfo}>
                <Text style={styles.courseName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.courseTags} numberOfLines={1}>
                    {item.tags}
                </Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <View>
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
                    {value ? (
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
            
            {homeScreen && filteredCourses.length > 0 && isSearchFocused && (
                <View style={styles.resultsContainer}>
                    <FlatList
                        data={filteredCourses.slice(0, 5)}
                        keyExtractor={(item: CoursesType) => item._id}
                        renderItem={renderCourseItem}
                    />
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