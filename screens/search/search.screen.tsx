import React from "react";
import { URL_SERVER, URL_IMAGES } from "@/utils/url";
import { Nunito_700Bold } from "@expo-google-fonts/nunito";
import { AntDesign, Ionicons, FontAwesome, FontAwesome5, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFonts } from "expo-font";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Animated, Modal } from "react-native"
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp
} from "react-native-responsive-screen";
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import * as userActions from "../../utils/store/actions/index";
import Slider from '@react-native-community/slider';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FE",
        paddingTop: 15,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1A1A2E",
        marginBottom: 15,
        fontFamily: "Nunito_700Bold",
    },
    filteringContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginBottom: 20,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        marginRight: 8,
    },
    searchIconContainer: {
        width: 45,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        paddingVertical: 12,
        fontFamily: "Nunito_700Bold",
    },
    coursesContainer: {
        paddingHorizontal: 16,
    },
    courseItem: {
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
        overflow: "hidden",
        height: hp(18),
    },
    courseContent: {
        flexDirection: "row",
        width: "100%",
    },
    courseImageContainer: {
        width: "40%",
        position: "relative",
    
        backgroundColor: '#f5f5f5',
    },
    courseImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    courseInfo: {
        flex: 1,
        padding: 12,
        paddingLeft: 16,
        justifyContent: "space-between",
        height: 140,
    },
    courseTitle: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: "#1A1A2E",
        marginBottom: 8,
    },
    courseMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        width: "100%",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.07)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
    },
    ratingText: {
        color: "#000",
        fontSize: 11,
        fontFamily: "Nunito_700Bold",
    },
    studentsText: {
        fontSize: 12,
        color: "#666",
    },
    lessonInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    lessonText: {
        fontSize: 12,
        color: "#666",
        marginLeft: 4,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    price: {
        fontSize: 16,
        color: "#2467EC",
        fontFamily: "Nunito_700Bold",
    },
    originalPrice: {
        fontSize: 12,
        color: "#999",
        textDecorationLine: "line-through",
        marginLeft: 8,
    },
    noResults: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    noResultsImage: {
        width: 120,
        height: 120,
        marginBottom: 20,
        tintColor: "#DADADA",
    },
    noResultsText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        fontFamily: "Nunito_700Bold",
        marginBottom: 10,
    },
    progressContainer: {
        position: "absolute",
        right: 12,
        top: 12,
        width: 40,
        height: 40,
        backgroundColor: "white",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    progressText: {
        position: "absolute",
        fontSize: 10,
        fontFamily: "Nunito_700Bold",
    },
    progressBarContainer: {
        marginTop: 8,
    },
    progressBarText: {
        fontSize: 12,
        marginTop: 4,
        fontFamily: "Nunito_700Bold",
    },
    wishBtnContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
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
    filterButton: {
        width: 45,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: hp(60),
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1A1A2E",
        fontFamily: "Nunito_700Bold",
    },
    filterContent: {
        flex: 1,
        paddingHorizontal: 10,
    },
    filterSection: {
        marginBottom: 20,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1A1A2E",
        marginBottom: 15,
        fontFamily: "Nunito_700Bold",
    },
    categoryContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingVertical: 5,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F0F0F0",
        marginBottom: 10,
    },
    categoryIcon: {
        marginRight: 8,
    },
    selectedCategory: {
        backgroundColor: "#4776E6",
    },
    categoryText: {
        color: "#666",
        fontFamily: "Nunito_700Bold",
    },
    selectedCategoryText: {
        color: "white",
    },
    priceRangeContainer: {
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    priceText: {
        textAlign: "center",
        marginBottom: 10,
        color: "#666",
        fontFamily: "Nunito_700Bold",
    },
    priceLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 15,
        width: "100%",
    },
    starButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0F0F0",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        width: wp(15),
        marginHorizontal: 5,
    },
    starButtonActive: {
        backgroundColor: "#4776E6",
    },
    starText: {
        marginLeft: 4,
        color: "#666",
        fontFamily: "Nunito_700Bold",
        fontSize: 13,
    },
    starTextActive: {
        color: "white",
    },
    studentsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    studentsInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 10,
        fontFamily: "Nunito_700Bold",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    resetButton: {
        flex: 1,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F0F0F0",
        borderRadius: 8,
        marginRight: 10,
    },
    resetButtonText: {
        color: "#666",
        fontFamily: "Nunito_700Bold",
        fontSize: 16,
    },
    applyButton: {
        flex: 1,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#4776E6",
        borderRadius: 8,
    },
    applyButtonText: {
        color: "white",
        fontFamily: "Nunito_700Bold",
        fontSize: 16,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    priceInput: {
        width: wp(35),
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        fontFamily: "Nunito_700Bold",
        backgroundColor: 'white',
    },
    priceDash: {
        fontSize: 16,
        color: '#666',
        marginHorizontal: 10,
    },
});

const SearchScreen = () => {
    const [value, setValue] = useState("");
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [progresses, setProgresses] = useState<Progress[]>([]);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [ratingFilter, setRatingFilter] = useState(0);
    const [studentsFilter, setStudentsFilter] = useState(0);
    const [priceMinMax, setPriceMinMax] = useState<[number, number]>([0, 1000000]);

    const userProgresses = useSelector((state: any) => state.user.progress);
    const wishList = useSelector((state: any) => state.user.wishList);
    const dispatch = useDispatch();

    const [wishStates, setWishStates] = useState<{[key: string]: boolean}>({});
    const [wishIds, setWishIds] = useState<{[key: string]: string}>({});
    const [activeAnimationId, setActiveAnimationId] = useState<string | null>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const categoryIcons: { [key: string]: string } = {
        'Web Development': 'code',
        'Mobile Development': 'mobile-alt',
        'UI/UX Design': 'paint-brush',
        'Data Science': 'chart-line',
        'Business': 'briefcase',
        'Marketing': 'bullhorn',
        'Photography': 'camera',
        'Music': 'music',
        'Language': 'language',
        'Personal Development': 'user-graduate',
        'default': 'folder'
    };

    const getCategoryIcon = (categoryTitle: string) => {
        return categoryIcons[categoryTitle] || categoryIcons.default;
    };

    const getProgressForCourse = (courseId: string) => {
        const progress = userProgresses.find((pro: any) => pro.courseId === courseId);
        return progress ? progress.progress : 0;
    };

    const isPurchased = (courseId: string) => {
        return userProgresses.some((pro: any) => pro.courseId === courseId);
    };

    const getProgressColor = (progress: number) => {
        return progress < 0.5 ? '#1c86b7' : '#237867';
    };

    const loadCategories = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-layout/Categories`);
            console.log('Categories from API:', response.data.layout.categories);
            
            // Update categoryIcons based on categories from API
            const categoryIconsMap: { [key: string]: string } = {};
            response.data.layout.categories.forEach((category: any) => {
                // Use existing icon mapping if available, otherwise set a specific icon
                categoryIconsMap[category.title] = categoryIcons[category.title] || getIconForCategory(category.title);
            });
            
            // Update the categoryIcons object with new mappings
            Object.keys(categoryIconsMap).forEach(key => {
                categoryIcons[key] = categoryIconsMap[key];
            });
            
            const categoriesWithIcons = response.data.layout.categories.map((category: any) => ({
                ...category,
                icon: categoryIcons[category.title] || 'book' // Default to 'book' if no mapping found
            }));
            setCategories(categoriesWithIcons);
        } catch (error) {
            console.log(error);
        }
    };
    
    // Function to assign specific icons based on category title keywords
    const getIconForCategory = (title: string) => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('web')) return 'code';
        if (titleLower.includes('mobile') || titleLower.includes('app')) return 'mobile-alt';
        if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) return 'paint-brush';
        if (titleLower.includes('data') || titleLower.includes('analytics')) return 'chart-line';
        if (titleLower.includes('business') || titleLower.includes('finance')) return 'briefcase';
        if (titleLower.includes('marketing') || titleLower.includes('sales')) return 'bullhorn';
        if (titleLower.includes('photo')) return 'camera';
        if (titleLower.includes('music') || titleLower.includes('audio')) return 'music';
        if (titleLower.includes('language') || titleLower.includes('english')) return 'language';
        if (titleLower.includes('personal') || titleLower.includes('development')) return 'user-graduate';
        if (titleLower.includes('health') || titleLower.includes('fitness')) return 'heartbeat';
        if (titleLower.includes('cooking') || titleLower.includes('food')) return 'utensils';
        if (titleLower.includes('art') || titleLower.includes('drawing')) return 'palette';
        if (titleLower.includes('video') || titleLower.includes('film')) return 'video';
        if (titleLower.includes('writing') || titleLower.includes('content')) return 'pen-fancy';
        if (titleLower.includes('science')) return 'flask';
        if (titleLower.includes('math')) return 'calculator';
        if (titleLower.includes('history')) return 'landmark';
        if (titleLower.includes('computer') || titleLower.includes('it')) return 'laptop-code';
        return 'book'; // Default icon
    };

    const applyFilters = () => {
        let filtered = courses;

        // Apply text search
        if (value) {
            filtered = filtered.filter((course: any) =>
                course.name.toLowerCase().includes(value.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter((course: any) => {
                // Find the selected category object
                const selectedCategoryObj: any = categories.find((cat: any) => cat._id === selectedCategory);
                if (!selectedCategoryObj) return false;
                
                // Check if course has this category
                return course.categories?.includes(selectedCategoryObj.title) || course.categories?.includes(selectedCategoryObj._id);
            });
        }

        // Apply price range filter if either min or max price is set
        if (priceRange[0] > 0 || priceRange[1] < 1000000) {
            filtered = filtered.filter((course: any) =>
                course.price >= priceRange[0] && course.price <= priceRange[1]
            );
        }

        // Apply rating filter
        if (ratingFilter > 0) {
            filtered = filtered.filter((course: any) =>
                course.ratings >= ratingFilter
            );
        }

        setFilteredCourses(filtered);
        setShowAdvancedSearch(false);
    };

    const resetFilters = () => {
        setPriceRange([0, 1000000]);
        setRatingFilter(0);
        setSelectedCategory("");
        setFilteredCourses(courses);
    };

    useFocusEffect(
        useCallback(() => {
            loadAllCourses();
            loadProgressOfUser();
            loadCategories();
        }, [])
    );

    useEffect(() => {
        if (value === "") {
            setFilteredCourses(courses);
        } else if (value.length > 0) {
            const filtered = courses.filter((course: CoursesType) => course.name.toLowerCase().includes(value.toLowerCase()));
            setFilteredCourses(filtered);
        }
    }, [value, courses])

    useEffect(() => {
        const newWishStates: {[key: string]: boolean} = {};
        const newWishIds: {[key: string]: string} = {};
        courses.forEach((course: any) => {
            const isWished = wishList.find((item: any) => item.courseId === course._id);
            if (isWished) {
                newWishStates[course._id] = true;
                newWishIds[course._id] = isWished._id;
            } else {
                newWishStates[course._id] = false;
                newWishIds[course._id] = '';
            }
        });
        setWishStates(newWishStates);
        setWishIds(newWishIds);
    }, [wishList, courses]);

    useEffect(() => {
        // Find min and max prices in courses to set slider range
        if (courses.length > 0) {
            const prices = courses.map((course: any) => course.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            setPriceMinMax([minPrice, maxPrice]);
            setPriceRange([minPrice, maxPrice]);
        }
    }, [courses]);

    const animateHeart = (courseId: string) => {
        setActiveAnimationId(courseId);
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
        ]).start(() => {
            setActiveAnimationId(null);
        });
    };

    const onAddToWishList = async (courseId: string) => {
        try {
            animateHeart(courseId);

            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.post(`${URL_SERVER}/wishlist`, {
                courseId: courseId
            }, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const data = {
                _id: response.data.data._id,
                userId: response.data.userId,
                courseId: courseId
            }
            dispatch(userActions.pushWishCourse(data));
        } catch (error) {
            console.log(error);
        }
    }

    const onRemoveFromWishList = async (courseId: string) => {
        try {
            animateHeart(courseId);

            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            await axios.delete(`${URL_SERVER}/wishlist?id=${wishIds[courseId]}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const data = {
                _id: wishIds[courseId],
            }
            dispatch(userActions.removeWishCourse(data));
        } catch (error) {
            console.log(error);
        }
    }

    const loadAllCourses = async () => {
        try {
            const response = await axios.get(`${URL_SERVER}/get-courses`);
            setCourses(response.data.courses);
            setFilteredCourses(response.data.courses);
        } catch (error) {
            console.log(error);
        }
    }


    const loadProgressOfUser = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.get(`${URL_SERVER}/user/progress`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            let _processes: Progress[] = [];
            if(response.data.response && response.data.response.progress){
                let _ = response.data.response.progress;
                _processes = _.map((progress: Progress) => ({
                    courseId: progress.courseId,
                    chapters: progress.chapters.map((chapter: Chapter) => ({
                        chapterId: chapter.chapterId,
                        isCompleted: chapter.isCompleted
                    }))
                }));
            }
            setProgresses(_processes);
        } catch (error) {
            console.log(error);
        }
    }

    const formatPrice = (price: string) => {
        // Remove non-numeric characters
        const numericValue = price.replace(/[^0-9]/g, '');
        // Format with thousand separators
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handlePriceChange = (value: string, isMin: boolean) => {
        const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        if (isMin) {
            setPriceRange([numericValue, priceRange[1]]);
        } else {
            setPriceRange([priceRange[0], numericValue]);
        }
    };

    let [fontsLoaded, fontError] = useFonts({
        Nunito_700Bold,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>


            <View style={styles.filteringContainer}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm kiếm khóa học..."
                        onChangeText={(v) => setValue(v)}
                        value={value}
                        placeholderTextColor={"#999"}
                    />
                    {value !== "" && (
                        <TouchableOpacity onPress={() => setValue("")}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => setShowAdvancedSearch(true)}
                    style={styles.filterButton}
                >
                    <Ionicons name="options-outline" size={24} color="#4776E6" />
                </TouchableOpacity>
            </View>

            <View style={styles.coursesContainer}>
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((item: any, index: number) => {
                        const progress = getProgressForCourse(item._id);
                        const hasPurchased = isPurchased(item._id);

                        return (
                            <TouchableOpacity
                                key={`${index}-c`}
                                style={styles.courseItem}
                                onPress={() => router.push({
                                    pathname: "/(routes)/course-details",
                                    params: { item: JSON.stringify(item), courseId: item?._id },
                                })}
                            >
                                <View style={styles.courseContent}>
                                    <View style={styles.courseImageContainer}>
                                        {item.thumbnail ? (
                                            <Image
                                                style={styles.courseImage}
                                                source={{ uri: item.thumbnail.url ? `${URL_IMAGES}/${item.thumbnail.url}` : `${URL_IMAGES}/${item.thumbnail}`}}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.courseImage, {justifyContent: 'center', alignItems: 'center'}]}>
                                                <Feather name="image" size={24} color="#999" />
                                            </View>
                                        )}
                                        <View style={styles.wishBtnContainer}>
                                            {!wishStates[item._id] ? (
                                                <TouchableOpacity
                                                    onPress={() => onAddToWishList(item._id)}
                                                    style={styles.wishBtn}
                                                    activeOpacity={0.7}
                                                >
                                                    <Animated.View
                                                        style={{
                                                            transform: [{
                                                                scale: activeAnimationId === item._id ? scaleAnim : 1
                                                            }]
                                                        }}
                                                    >
                                                        <AntDesign name="hearto" size={15} color="#FF385C" style={styles.heartIcon} />
                                                    </Animated.View>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => onRemoveFromWishList(item._id)}
                                                    style={styles.wishBtn}
                                                    activeOpacity={0.7}
                                                >
                                                    <Animated.View
                                                        style={{
                                                            transform: [{
                                                                scale: activeAnimationId === item._id ? scaleAnim : 1
                                                            }]
                                                        }}
                                                    >
                                                        <AntDesign name="heart" size={15} color="#FF385C" style={styles.heartIcon} />
                                                    </Animated.View>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.courseInfo}>
                                        <Text style={styles.courseTitle} numberOfLines={2}>{item.name}</Text>
                                        <View style={styles.courseMeta}>
                                            <View style={styles.ratingContainer}>
                                                <FontAwesome name="star" size={12} color="#ffb800" />
                                                <Text style={styles.ratingText}>{item?.ratings?.toFixed(1)}</Text>
                                            </View>
                                            <Text style={styles.studentsText}>
                                                {item.purchased} <FontAwesome5 name="user" size={12} color="#666" />
                                            </Text>
                                        </View>
                                        <View style={styles.lessonInfo}>
                                            <Ionicons name="list-outline" size={14} color="#666" />
                                            <Text style={styles.lessonText}>{item.courseData.length} bài học</Text>
                                        </View>
                                        {hasPurchased ? (
                                            <View style={styles.progressBarContainer}>
                                                <Progress.Bar
                                                    progress={progress}
                                                    width={null}
                                                    height={4}
                                                    color={getProgressColor(progress)}
                                                />
                                                <Text style={[styles.progressBarText, { color: getProgressColor(progress) }]}>
                                                    {Math.round(progress * 100)}%
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.price}>{item?.price.toLocaleString()}đ</Text>
                                                <Text style={styles.originalPrice}>{item?.estimatedPrice?.toLocaleString()}đ</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.noResults}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486754.png' }}
                            style={styles.noResultsImage}
                        />
                        <Text style={styles.noResultsText}>
                            Không tìm thấy khóa học phù hợp
                        </Text>
                    </View>
                )}
            </View>

            <Modal
                visible={showAdvancedSearch}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAdvancedSearch(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tìm kiếm nâng cao</Text>
                            <TouchableOpacity
                                onPress={() => setShowAdvancedSearch(false)}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.filterSection}>
                                <Text style={styles.filterTitle}>Danh mục</Text>
                                <View style={styles.categoryContainer}>
                                    {categories.map((category: any) => (
                                        <TouchableOpacity
                                            key={category._id}
                                            style={[
                                                styles.categoryItem,
                                                selectedCategory === category._id && styles.selectedCategory
                                            ]}
                                            onPress={() => setSelectedCategory(
                                                selectedCategory === category._id ? "" : category._id
                                            )}
                                        >
                                            <FontAwesome5 
                                                name={category.icon || getCategoryIcon(category.title)} 
                                                size={14} 
                                                color={selectedCategory === category._id ? "white" : "#666"}
                                                style={styles.categoryIcon}
                                            />
                                            <Text style={[
                                                styles.categoryText,
                                                selectedCategory === category._id && styles.selectedCategoryText
                                            ]}>
                                                {category.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterTitle}>Khoảng giá</Text>
                                <View style={styles.priceInputContainer}>
                                    <TextInput
                                        style={styles.priceInput}
                                        keyboardType="numeric"
                                        value={priceRange[0].toLocaleString()}
                                        onChangeText={(value) => handlePriceChange(value, true)}
                                        placeholder="Giá thấp nhất"
                                        placeholderTextColor="#999"
                                    />
                                    <Text style={styles.priceDash}>-</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        keyboardType="numeric"
                                        value={priceRange[1].toLocaleString()}
                                        onChangeText={(value) => handlePriceChange(value, false)}
                                        placeholder="Giá cao nhất"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterTitle}>Đánh giá từ</Text>
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            style={[
                                                styles.starButton,
                                                ratingFilter === star && styles.starButtonActive
                                            ]}
                                            onPress={() => {
                                                setRatingFilter(star === ratingFilter ? 0 : star);
                                            }}
                                        >
                                            <AntDesign
                                                name="star"
                                                size={16}
                                                color={ratingFilter === star ? "white" : "#FFB800"}
                                            />
                                            <Text style={[
                                                styles.starText,
                                                ratingFilter === star && styles.starTextActive
                                            ]}>{star}+</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={resetFilters}
                            >
                                <Text style={styles.resetButtonText}>Đặt lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={applyFilters}
                            >
                                <Text style={styles.applyButtonText}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    )
}

export default SearchScreen;