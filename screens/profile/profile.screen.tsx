import useUser from "@/hooks/useUser";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native"
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { URL_IMAGE, URL_IMAGES, URL_SERVER, URL_VIDEO } from "@/utils/url";
import Loader from "@/components/loader";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Entypo, Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as userActions from "../../utils/store/actions";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const [image, setImage] = useState<any>(null);
    const [loader, setLoader] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const progress = useSelector((state: any) => state.user.progress);
    
    let [fontsLoaded, fontsError] = useFonts({
        Raleway_600SemiBold,
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_600SemiBold,
        Nunito_700Bold,
    });

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    const OnLogoutHandler = async () => {
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        await AsyncStorage.removeItem("cart");
        await AsyncStorage.removeItem("paymented");
        dispatch(userActions.saveProgressOfUser([]));
        dispatch(userActions.resetUserInfo());
        router.push("/(routes)/sign-in");
    }

    const OnPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setLoader(true);
        
            const imageFile = {
                uri: result.assets[0].uri,
                type: result.assets[0].mimeType, // 'image/png'
                name: result.assets[0].fileName,  // '9ef9877c-1e37-43d9-bacd-864be6cc0eb7.png'
                size: result.assets[0].fileSize,  // 75016
            };
            // Tạo form data
            const formData = new FormData();
            
            // Thêm file ảnh vào form data
            formData.append('avatar', imageFile as any);

            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");

            try {
                const response = await axios.put(
                    `${URL_IMAGE}/update-user-avatar`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            "access-token": accessToken,
                            "refresh-token": refreshToken
                        }
                    }
                );
                
                if (response.data) {
                    let {_id, name, email, avatar} = response.data.user;
                    let payload = {
                        _id, name, email, avatarUrl: avatar.url
                    };
                    dispatch(userActions.saveUserInfo(payload));
                    setImage(avatar.url ?? '');
                    setLoader(false);
                }
            } catch (error) {
                console.log(error);
                setLoader(false);
            }
        }
    }

    useEffect(() => {
        setImage(user.userInfo.avatarUrl);
    }, [])
    
    return (
        <>
            {loader ? (
                <Loader />
            ) : (
                <SafeAreaView style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header Section with Background */}
                        <View style={styles.headerSection}>
                            {/* Pattern Background */}
                            <View style={styles.patternBackground}>
                                <View style={styles.patternCircle1} />
                                <View style={styles.patternCircle2} />
                                <View style={styles.patternCircle3} />
                            </View>
                            
                            {/* Profile Card */}
                            <View style={styles.profileCard}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatarWrapper}>
                                        <Image
                                            source={{uri: `${URL_IMAGES}/${image}`}}
                                            style={styles.avatar}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editAvatarButton}
                                        onPress={() => OnPickImage()}
                                    >
                                        <LinearGradient
                                            colors={['#2467EC', '#4F8CEF']}
                                            style={styles.editAvatarGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Feather name="camera" size={18} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.userInfoContainer}>
                                    <Text style={styles.userName}>
                                        {user.userInfo.name}
                                    </Text>
                                    <Text style={styles.userEmail}>
                                        {user.userInfo.email}
                                    </Text>
                                </View>
                                
                                <View style={styles.userStatsRow}>
                                    <View style={styles.userStatItem}>
                                        <View style={styles.statIconContainer}>
                                            <Entypo name="graduation-cap" size={16} color="#2467EC" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>{progress.length}</Text>
                                            <Text style={styles.statLabel}>Khóa học</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.statDivider} />
                                    
                                    <View style={styles.userStatItem}>
                                        <View style={styles.statIconContainer}>
                                            <Feather name="check-circle" size={16} color="#2467EC" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>
                                                {progress.filter((course: any) => parseFloat(course.progress) === 1).length}
                                            </Text>
                                            <Text style={styles.statLabel}>Hoàn thành</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        {/* Menu Section */}
                        <View style={styles.menuSection}>
                            <Text style={styles.menuTitle}>
                                Tài khoản của tôi
                            </Text>
                            
                            {/* Profile Details */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push("/(routes)/infor")}
                            >
                                <View style={styles.menuIconContainer}>
                                    <MaterialIcons name="person-outline" size={22} color="#2467EC" />
                                </View>
                                
                                <View style={styles.menuContent}>
                                    <View>
                                        <Text style={styles.menuItemTitle}>Chi tiết hồ sơ</Text>
                                        <Text style={styles.menuItemSubtitle}>Thông tin tài khoản</Text>
                                    </View>
                                    <AntDesign name="right" size={20} color="#CBD5E0" />
                                </View>
                            </TouchableOpacity>
                            
                            {/* Enrolled Courses */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push("/(routes)/enrolled-courses")}
                            >
                                <View style={styles.menuIconContainer}>
                                    <Entypo name="open-book" size={22} color="#2467EC" />
                                </View>
                                
                                <View style={styles.menuContent}>
                                    <View>
                                        <Text style={styles.menuItemTitle}>Khóa học đã tham gia</Text>
                                        <Text style={styles.menuItemSubtitle}>Toàn bộ các khóa học đã tham gia</Text>
                                    </View>
                                    <AntDesign name="right" size={20} color="#CBD5E0" />
                                </View>
                            </TouchableOpacity>
                            
                            {/* Privacy Policy */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push("/(routes)/privacy")}
                            >
                                <View style={styles.menuIconContainer}>
                                    <MaterialIcons name="privacy-tip" size={22} color="#2467EC" />
                                </View>
                                
                                <View style={styles.menuContent}>
                                    <View>
                                        <Text style={styles.menuItemTitle}>Chính sách bảo mật</Text>
                                        <Text style={styles.menuItemSubtitle}>Quy định về quyền riêng tư</Text>
                                    </View>
                                    <AntDesign name="right" size={20} color="#CBD5E0" />
                                </View>
                            </TouchableOpacity>
                            
                            {/* FAQ */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push("/(routes)/faq")}
                            >
                                <View style={styles.menuIconContainer}>
                                    <FontAwesome name="question-circle" size={22} color="#2467EC" />
                                </View>
                                
                                <View style={styles.menuContent}>
                                    <View>
                                        <Text style={styles.menuItemTitle}>Các câu hỏi thường gặp</Text>
                                        <Text style={styles.menuItemSubtitle}>Giải đáp thắc mắc phổ biến</Text>
                                    </View>
                                    <AntDesign name="right" size={20} color="#CBD5E0" />
                                </View>
                            </TouchableOpacity>
                            
                            {/* Logout */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => OnLogoutHandler()}
                            >
                                <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
                                    <MaterialIcons name="logout" size={22} color="#FF5151" />
                                </View>
                                
                                <View style={styles.menuContent}>
                                    <View>
                                        <Text style={[styles.menuItemTitle, styles.logoutText]}>Đăng xuất</Text>
                                        <Text style={styles.menuItemSubtitle}>Rời khỏi tài khoản của bạn</Text>
                                    </View>
                                    <AntDesign name="right" size={20} color="#CBD5E0" />
                                </View>
                            </TouchableOpacity>
                        </View>
                        
                        {/* App Version */}
                        <View style={styles.versionContainer}>
                            <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    headerSection: {
        position: 'relative',
        paddingBottom: 30,
    },
    patternBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: '#f8f8f8',
        overflow: 'hidden',
    },
    patternCircle1: {
        position: 'absolute',
        top: -50,
        left: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#2467EC',
        opacity: 0.05,
    },
    patternCircle2: {
        position: 'absolute',
        top: 20,
        right: -70,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#2467EC',
        opacity: 0.07,
    },
    patternCircle3: {
        position: 'absolute',
        bottom: -60,
        left: 60,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#2467EC',
        opacity: 0.08,
    },
    profileCard: {
        marginTop: 50,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginTop: -60,
        marginBottom: 15,
    },
    avatarWrapper: {
        borderRadius: 60,
        padding: 3,
        backgroundColor: '#FFFFFF',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: '#F0F0F0',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    editAvatarGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userInfoContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontFamily: 'Raleway_700Bold',
        color: '#333333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#757575',
    },
    userStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    userStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EDF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statValue: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#2467EC',
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: '#757575',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F0F0F0',
    },
    menuSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        margin: 20,
        marginTop: 10,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    menuTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#333333',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: '#EDF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    logoutIconContainer: {
        backgroundColor: '#FFEBEB',
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuItemTitle: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#333333',
        marginBottom: 5,
    },
    menuItemSubtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#757575',
    },
    logoutText: {
        color: '#FF5151',
    },
    versionContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    versionText: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#9CA3AF',
    },
});

export default ProfileScreen;