import { URL_SERVER } from "@/utils/url";
import { AntDesign, Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress";
import * as Progress from "react-native-progress";
import {
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";

const CourseProgress = ({progress} : {progress: any}) => {
    const [modalResultVisible, setModalResultVisible] = useState(false);

    const onFinish = async (id: string) => {
        try {
            if(progress.progress === 1){
                const accessToken = await AsyncStorage.getItem('access_token');
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                axios.post(`${URL_SERVER}/user/get-certificate`, {
                    courseId: id,
                    courseName: progress.name
                }, {
                    headers: {
                        'access-token': accessToken,
                        'refresh-token': refreshToken
                    }
                })
                setModalResultVisible(true);
            }else{
                Alert.alert(
                    'Xin lỗi',
                    'Bạn phải hoàn thành khóa học trước khi nhấn',
                    [
                      {
                        text: 'Đóng',
                        style: 'cancel',
                      },
                    ],
                )
            }
        } catch (error) {
            console.log(error);
        }
    }

    const renderResultModal = () => {
        return (
            <View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalResultVisible}
                    onRequestClose={
                        () => {
                            setModalResultVisible(!modalResultVisible);
                        }
                    }
                >
                    <View style={[styles.centeredView]}>
                        <View style={[styles.modalView]}>
                            <View style={styles.successIconContainer}>
                                <AntDesign name="checkcircle" size={50} color="#27AE60" />
                            </View>
                            <Text style={styles.modalTitle}>Chúc mừng bạn đã hoàn thành khóa học!</Text>
                            <Text style={styles.modalText}>Chứng chỉ của khóa học đã được gửi</Text>
                            <Text style={styles.modalText}>về mail đăng ký. Vui lòng kiểm tra.</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalResultVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }

    return (
        <View style={styles.courseWrapper}>
            <View style={styles.courseContainer}>
                {/* Course header with progress circle */}
                <View style={styles.courseHeader}>
                    <View style={styles.courseInfo}>
                        <View style={styles.courseTitleContainer}>
                            <Text style={styles.detailText} numberOfLines={2} ellipsizeMode="tail">
                                {progress.name}
                            </Text>
                        </View>
                        <View style={styles.courseMeta}>
                            <View style={styles.courseMetaItem}>
                                <MaterialIcons name="library-books" size={16} color="#757575" />
                                <Text style={styles.courseMetaText}>{progress.total} Bài học</Text>
                            </View>
                            <View style={styles.courseMetaItem}>
                                <Feather name="clock" size={16} color="#757575" />
                                <Text style={styles.courseMetaText}>
                                    {Math.round(progress.progress * 100)}% Hoàn thành
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.progressCircleContainer}>
                        <AnimatedCircularProgress
                            size={70}
                            width={6}
                            backgroundWidth={5}
                            fill={progress.progress * 100}
                            tintColor="#27AE60"
                            backgroundColor="rgba(39, 174, 96, 0.2)"
                            rotation={0}
                            duration={1000}
                            lineCap="round"
                        >
                            {(fillValue) => (
                                <View style={styles.progressCircleTextContainer}>
                                    <Text style={styles.progressCircleText}>
                                        {Math.round(fillValue)}%
                                    </Text>
                                </View>
                            )}
                        </AnimatedCircularProgress>
                    </View>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                    <Progress.Bar
                        progress={progress.progress}
                        width={null}
                        height={8}
                        borderRadius={4}
                        color="#27AE60"
                        unfilledColor="rgba(39, 174, 96, 0.1)"
                        borderWidth={0}
                        style={styles.progressBar}
                    />
                </View>
                
                {/* Action button */}
                <View style={styles.actionsContainer}>
                    {progress.progress === 1 ? (
                        <TouchableOpacity 
                            style={styles.certificateButton}
                            onPress={() => onFinish(progress.courseId)}
                        >
                            <MaterialCommunityIcons name="certificate" size={18} color="#FFFFFF" />
                            <Text style={styles.certificateButtonText}>Nhận chứng chỉ</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.progressStatus}>
                            <View style={styles.progressStatusIcon}>
                                <AntDesign name="infocirlceo" size={14} color="#F7B731" />
                            </View>
                            <Text style={styles.progressStatusText}>
                                Hoàn thành khóa học để nhận chứng chỉ
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            {modalResultVisible && renderResultModal()}
        </View>
    )
}

const styles = StyleSheet.create({
    courseWrapper: {
        width: '100%',
    },
    courseContainer: {
        width: '100%',
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 3,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    courseInfo: {
        flex: 1,
        marginRight: 16,
    },
    courseTitleContainer: {
        marginBottom: 8,
    },
    detailText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        lineHeight: 24,
    },
    courseMeta: {
        marginTop: 6,
    },
    courseMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    courseMetaText: {
        fontSize: 14,
        color: '#757575',
        marginLeft: 6,
    },
    progressCircleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircleTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27AE60',
    },
    progressBarContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    progressBar: {
        alignSelf: 'stretch',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    certificateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0984E3',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#0984E3',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    certificateButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    progressStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressStatusIcon: {
        marginRight: 6,
    },
    progressStatusText: {
        fontSize: 14,
        color: '#F7B731',
        fontWeight: '500',
    },
    
    // Modal styles
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    successIconContainer: {
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginVertical: 2,
    },
    closeButton: {
        width: 120,
        paddingVertical: 12,
        backgroundColor: '#0984E3',
        marginTop: 24,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
})

export default CourseProgress;