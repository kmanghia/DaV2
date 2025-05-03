import useUser from "@/hooks/useUser";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Dimensions, Alert } from "react-native"
import axios from "axios";
import { URL_IMAGES, URL_SERVER, URL_VIDEO } from "@/utils/url";
import Loader from "@/components/loader";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { userActions } from "@/redux/actions/userActions";
import * as userStoreActions from "@/utils/store/actions/user.actions";

const { width } = Dimensions.get('window');

const InforScreen = () => {
    const [image, setImage] = useState<any>(null);
    const [loader, setLoader] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        createdAt:''
    });
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState('');
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

    const GetProfileUser = async () => {
            //Thêm file ảnh vào form data
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");

            try {
                const response = await axios.get(
                    `${URL_SERVER}/me`,
             
                    {
                        headers: {
                            "access-token": accessToken,
                            "refresh-token": refreshToken
                        }
                    }
                );
                
                if (response.data) {
                    setUserData({
                        name: response.data.user.name,
                        email: response.data.user.email,
                        createdAt: response.data.user.createdAt
                    });
                    setNewName(response.data.user.name);
                }
            } catch (error) {
                console.log(error);
                setLoader(false);
        }
    }

    const updateUserInfo = async () => {
        if (newName.trim() === '') {
            Alert.alert('Lỗi', 'Tên không được để trống');
            return;
        }

        setLoader(true);
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        try {
            const response = await axios.put(
                `${URL_SERVER}/update-user-info`,
                { name: newName.trim() },
                {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                }
            );
            
            if (response.data) {
                setUserData(prev => ({
                    ...prev,
                    name: newName
                }));
                
                // Cập nhật thông tin trong Redux store
                dispatch(userStoreActions.saveUserInfo({
                    ...user.userInfo,
                    name: newName
                }));
                
                setEditMode(false);
                Alert.alert('Thành công', 'Đã cập nhật thông tin thành công');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        } finally {
            setLoader(false);
        }
    }

    useEffect(() => {
        setImage(user.userInfo.avatarUrl);
        GetProfileUser();
    }, [])
    
    return (
        <>
            {loader ? (
                <Loader />
            ) : (
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                        <View style={{width: 40}} />
                    </View>
                    
                    <ScrollView 
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Profile Image */}
                        <View style={styles.profileImageContainer}>
                            <View style={styles.patternBackground}>
                                <View style={styles.patternCircle1} />
                                <View style={styles.patternCircle2} />
                            </View>
                            
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={{uri: `${URL_IMAGES}/${image}`}}
                                    style={styles.profileImage}
                                />
                            </View>
                            
                            <Text style={styles.userName}>{userData.name}</Text>
                        </View>
                        
                        {/* Information Card */}
                        <View style={styles.infoCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Chi tiết tài khoản</Text>
                                {!editMode ? (
                                    <TouchableOpacity 
                                        style={styles.editButton}
                                        onPress={() => setEditMode(true)}
                                    >
                                        <Feather name="edit-2" size={16} color="#2467EC" />
                                        <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.saveButton}
                                        onPress={updateUserInfo}
                                    >
                                        <Feather name="check" size={16} color="#2467EC" />
                                        <Text style={styles.saveButtonText}>Lưu</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            {/* Name Field */}
                            <View style={styles.fieldContainer}>
                                <View style={styles.fieldIconContainer}>
                                    <MaterialIcons name="person" size={20} color="#2467EC" />
                                </View>
                                <View style={styles.fieldContent}>
                                    <Text style={styles.fieldLabel}>Họ và tên</Text>
                                    <TextInput
                                        value={editMode ? newName : userData.name}
                                        editable={editMode}
                                        onChangeText={setNewName}
                                        style={[
                                            styles.fieldInput,
                                            editMode && styles.fieldInputEditable
                                        ]}
                                        placeholder="Tên người dùng"
                                    />
                                </View>
                            </View>
                            
                            {/* Email Field */}
                            <View style={styles.fieldContainer}>
                                <View style={styles.fieldIconContainer}>
                                    <MaterialIcons name="email" size={20} color="#2467EC" />
                                </View>
                                <View style={styles.fieldContent}>
                                    <Text style={styles.fieldLabel}>Địa chỉ email</Text>
                                    <TextInput
                                        value={userData.email}
                                        editable={false}
                                        style={styles.fieldInput}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>
                            
                            {/* Member Since Field */}
                            <View style={styles.fieldContainer}>
                                <View style={styles.fieldIconContainer}>
                                    <Feather name="clock" size={20} color="#2467EC" />
                                </View>
                                <View style={styles.fieldContent}>
                                    <Text style={styles.fieldLabel}>Thành viên từ</Text>
                                    <Text style={styles.fieldValue}>
                                        {`Tháng ${new Date(userData.createdAt).getMonth() + 1}, ${new Date(userData.createdAt).getFullYear()}`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* Account Status Card */}
                        <View style={styles.statusCard}>
                            <LinearGradient
                                colors={['#2467EC', '#4F8CEF']}
                                style={styles.statusGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.statusContent}>
                                    <MaterialIcons name="verified-user" size={30} color="#FFF" />
                                    <View style={styles.statusTextContainer}>
                                        <Text style={styles.statusTitle}>Tài khoản đã xác minh</Text>
                                        <Text style={styles.statusDescription}>Tài khoản của bạn đã được xác minh qua email</Text>
                                    </View>
                                </View>
                            </LinearGradient>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    profileImageContainer: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 30,
        position: 'relative',
    },
    patternBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    patternCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#2467EC',
        opacity: 0.05,
    },
    patternCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -50,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#2467EC',
        opacity: 0.07,
    },
    imageWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    userName: {
        fontSize: 22,
        fontFamily: 'Raleway_700Bold',
        color: '#333',
        marginTop: 15,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#333',
        marginBottom: 20,
    },
    fieldContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    fieldIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        marginTop: 8,
    },
    fieldContent: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#757575',
        marginBottom: 5,
    },
    fieldInput: {
        height: 45,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#333',
        backgroundColor: '#F8F8F8',
    },
    fieldValue: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#333',
        paddingVertical: 10,
    },
    statusCard: {
        marginHorizontal: 16,
        marginBottom: 30,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#2467EC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusGradient: {
        padding: 20,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: '#FFFFFF',
        opacity: 0.9,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editButtonText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#2467EC',
        marginLeft: 5,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    saveButtonText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#2467EC',
        marginLeft: 5,
    },
    fieldInputEditable: {
        backgroundColor: '#FFFFFF',
        borderColor: '#2467EC',
    },
});

export default InforScreen;