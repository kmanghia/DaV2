import Loader from "@/components/loader";
import { URL_SERVER, URL_IMAGES } from "@/utils/url";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { 
    ScrollView, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Alert, 
    Modal, 
    Pressable, 
    Image,
    StatusBar,
    SafeAreaView,
    Dimensions
} from "react-native";
import useUser from "@/hooks/useUser";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Nunito_400Regular, Nunito_500Medium, Nunito_700Bold, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import { AntDesign, Entypo, FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');

const CourseQuizzScreen = () => {
    const { courseData, activeVideo, id } = useLocalSearchParams();
    const {user} = useUser();
    const data: CoursesType = JSON.parse(courseData as string);    
    const [questions, setQuestions] = useState<IQuizz[]>([]);
    const [seletedOptions, setSelectedOptions] = useState<{[key: number]: any}>({});
    const [scored, setScored] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lesson, setLesson] = useState<any>(data.courseData[activeVideo as any]);
    const [modalResultVisible, setModalVisible] = useState(false);
    const MAX_POINTS_SCREEN = 100;
    const [fillScreen, setFillScreen] = useState(0);

    useEffect(() => {
        setLoading(true);
        getQuestions();
        const description = async () => {
            try {
                const accessToken = await AsyncStorage.getItem("access_token");
                const refreshToken = await AsyncStorage.getItem("refresh_token");
                const response = await axios.get(`${URL_SERVER}/quizzs/${user?._id}?lessonId=${lesson._id}`,{
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken
                    }
                });
                const userId = response.data.userId;
                const data = response.data.response.filter((item: OwnerQuizz) => item.userId === userId);
                const _data = data.filter((item: OwnerQuizz) => item.lessonId === lesson._id);
                if(_data.length > 0){
                    const result = _data[_data.length - 1];
                    setSelectedOptions(result.selected_options);
                    setScored(result.scored);
                    setShowResults(true);
                    setModalVisible(true);
                }
            } catch (error) {
                console.log(error);
            }finally{
                setLoading(false);
            }
        }
        description();
    },[])

    useEffect(() => {
        if(questions.length > 0){
            setFillScreen((scored / questions.length) * MAX_POINTS_SCREEN);
        }
    }, [scored])

    const getQuestions = () => {
        axios
            .get(`${URL_SERVER}/get-courses`)
            .then((response) => {
                const course = response.data.courses.filter(
                    (course: CoursesType) => course._id === id
                )[0];
                setLesson(course.courseData[activeVideo as any]);
                setQuestions(course.courseData[activeVideo as any].iquizz as IQuizz[]);
            })
            .catch((error) => {
                console.log('>>> Line: 68');
                console.log(error);
            })
    }

    const OnHandleOptionSelect = (questionIndex: any, option: any) => {
        const updatedOptions = {
            ...seletedOptions,
            [questionIndex]: option
        };
        setSelectedOptions(updatedOptions); // {0: 1, 1: 3, }
    }

    const OnHandleSubmit = async () => {
        let correctAnswers = 0;
        questions.forEach((question: IQuizz, index: any) => {
            if (question.options[seletedOptions[index]] === question.correctAnswer) {
                correctAnswers++;
            }
        });
        setScored(correctAnswers);
        setFillScreen((correctAnswers / questions.length) * MAX_POINTS_SCREEN);
        setShowResults(true);

        try {
            let data = {
                userId: user?._id,
                courseId: id,
                lessonId: lesson._id,
                scored: correctAnswers,
                selected_options: seletedOptions
            }
            await axios.post(`${URL_SERVER}/save-quizz`, data);
        } catch (error) {
            console.log(error);
        }
        
    }

    const onRetry = () => {
        setSelectedOptions({});
        setScored(0);
        setFillScreen((0 / questions.length) * MAX_POINTS_SCREEN);
        setShowResults(false);
        setModalVisible(false);
    }

    let [fontsLoaded, fontsError] = useFonts({
        Raleway_600SemiBold,
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_700Bold,
        Nunito_600SemiBold,
    });

    if (!fontsLoaded && !fontsError) {
        return null;
    }

    const closeModal = () => {
        setModalVisible(false);
    }

    const renderResultModal = () => {
        const MAX_POINTS = 100;
        const fill = (scored / questions.length) * MAX_POINTS;
        return (
            <View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalResultVisible}
                    onRequestClose={() => {
                        Alert.alert('Modal has been closed.');
                        setModalVisible(!modalResultVisible);
                    }
                }>
                    <View style={styles.modalOverlay}>
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalHeaderText}>Kết quả bài kiểm tra</Text>
                                </View>
                                
                                <View style={styles.modalScoreContainer}>
                                    <AnimatedCircularProgress
                                        size={140}
                                        width={12}
                                        backgroundWidth={12}
                                        fill={fill}
                                        tintColor="#0085ff"
                                        backgroundColor="rgba(0, 133, 255, 0.15)"
                                        rotation={0}
                                        duration={2000}
                                        lineCap="round"
                                    >
                                        {(fillValue) => (
                                            <View style={styles.scoreValueContainer}>
                                                <Text style={styles.scoreValue}>
                                                    {Math.round((fillValue / 100) * MAX_POINTS)}
                                                </Text>
                                                <Text style={styles.scoreMaxValue}>/100</Text>
                                            </View>
                                        )}
                                    </AnimatedCircularProgress>
                                </View>
                                
                                <View style={styles.modalStatsContainer}>
                                    <View style={styles.modalStatsRow}>
                                        <View style={styles.modalStatItem}>
                                            <View style={styles.statIconContainer}>
                                                <FontAwesome5 name="check-circle" size={16} color="#3db655" />
                                            </View>
                                            <View>
                                                <Text style={styles.statValue}>{scored}</Text>
                                                <Text style={styles.statLabel}>Câu đúng</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.modalStatItem}>
                                            <View style={[styles.statIconContainer, { backgroundColor: '#FFEFEF' }]}>
                                                <FontAwesome5 name="times-circle" size={16} color="#FF5151" />
                                            </View>
                                            <View>
                                                <Text style={[styles.statValue, { color: '#FF5151' }]}>{questions.length - scored}</Text>
                                                <Text style={styles.statLabel}>Câu sai</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.modalStatsRow}>
                                        <View style={styles.modalStatItem}>
                                            <View style={[styles.statIconContainer, { backgroundColor: '#EEF6FF' }]}>
                                                <FontAwesome5 name="question-circle" size={16} color="#0085ff" />
                                            </View>
                                            <View>
                                                <Text style={[styles.statValue, { color: '#0085ff' }]}>{questions.length}</Text>
                                                <Text style={styles.statLabel}>Tổng câu hỏi</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.modalStatItem}>
                                            <View style={[styles.statIconContainer, { backgroundColor: '#F1F8ED' }]}>
                                                <FontAwesome5 name="percentage" size={16} color="#3db655" />
                                            </View>
                                            <View>
                                                <Text style={[styles.statValue, { color: '#3db655' }]}>{Math.round((scored/questions.length) * 100)}%</Text>
                                                <Text style={styles.statLabel}>Tỷ lệ đúng</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                
                                <View style={styles.modalActionsContainer}>
                                    <TouchableOpacity 
                                        style={[styles.modalActionButton, styles.retryButton]}
                                        onPress={() => onRetry()}
                                    >
                                        <AntDesign name="reload1" size={18} color="#FFFFFF" />
                                        <Text style={styles.modalActionButtonText}>Làm lại</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.reviewButton]} 
                                        onPress={() => closeModal()}
                                    >
                                        <Octicons name="eye" size={18} color="#FFFFFF" />
                                        <Text style={styles.modalActionButtonText}>Xem lại</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }

    const renderTextFinishScreen = () => {
        const questionLength = questions.length;
        let selectedLength = 0;
        Object.keys(seletedOptions).forEach(key => {
            selectedLength++;
        })
        const finishQuantity = (selectedLength / questionLength) * 100;
        return (
            <>
                { showResults ?
                    (
                        <Text style={styles.statValue}>{finishQuantity}%</Text>
                    ) : (
                        <Text style={styles.statValue}>0%</Text>
                    )
                }
            </>
        )
    }

    const renderTextCorrectScreen = () => {
        const quizzs = questions;
        let correctLength = 0;
        quizzs.forEach((quizz, index) => {
            if(quizz.options[seletedOptions[index]] === quizz.correctAnswer){
                correctLength++;
            }
        });
        return (
            <>
                { showResults ? 
                    (
                        <Text style={[styles.statValue, {color: '#3db655'}]}>{correctLength}</Text>
                    ):(
                        <Text style={[styles.statValue, {color: '#3db655'}]}>0</Text>
                    )
                }
            </>
        )
    }

    const renderTextWrongScreen = () => {
        const quizzs = questions;
        let correctLength = 0;
        quizzs.forEach((quizz, index) => {
            if(quizz.options[seletedOptions[index]] === quizz.correctAnswer){
                correctLength++;
            }
        });
        return (
            <>
                { showResults ? 
                    (
                        <Text style={[styles.statValue, {color: '#FF5151'}]}>{questions.length - correctLength}</Text>
                    ):(
                        <Text style={[styles.statValue, {color: '#FF5151'}]}>0</Text>
                    )
                }
            </>
        )
    }

    const getOptionLetterLabel = (index: number) => {
        return ['A', 'B', 'C', 'D'][index];
    };

    return (
        <>
            <StatusBar barStyle="dark-content" />
            { loading ? (
                <Loader />
            ) : (
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Bài kiểm tra</Text>
                        <Text style={styles.headerSubtitle}>{lesson?.title}</Text>
                    </View>
                    
                    <ScrollView 
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollViewContent}
                    >
                        {/* Questions */}
                        { questions.length > 0 &&
                            questions.map((item: IQuizz, index: number) => (
                                <View style={styles.questionCard} key={item._id}>
                                    <View style={styles.questionHeader}>
                                        <View style={styles.questionNumberBadge}>
                                            <Text style={styles.questionNumberText}>Câu {index + 1}</Text>
                                        </View>
                                        {showResults && (
                                            <View style={styles.questionStatusContainer}>
                                                {item.options[seletedOptions[index]] === item.correctAnswer ? (
                                                    <View style={styles.correctBadge}>
                                                        <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                                        <Text style={styles.statusBadgeText}>Đúng</Text>
                                                    </View>
                                                ) : seletedOptions[index] !== undefined ? (
                                                    <View style={styles.incorrectBadge}>
                                                        <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                                                        <Text style={styles.statusBadgeText}>Sai</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.missedBadge}>
                                                        <MaterialIcons name="remove" size={12} color="#FFFFFF" />
                                                        <Text style={styles.statusBadgeText}>Chưa trả lời</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                    
                                    <Text style={styles.questionText}>{item.question}</Text>
                                    
                                    {/* Display question image if it exists */}
                                    {item.questionImage && item.questionImage.url && (
                                        <View style={styles.questionImageContainer}>
                                            <Image 
                                                source={{ uri: `${URL_IMAGES}/${item.questionImage.url}` }}
                                                style={styles.questionImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    )}
                                    
                                    <View style={styles.optionsContainer}>
                                        {item.options.map((option, optionIndex) => (
                                            <TouchableOpacity
                                                key={optionIndex}
                                                style={[
                                                    styles.optionButton,
                                                    seletedOptions[index] === optionIndex && styles.selectedOption,
                                                    showResults && item.correctAnswer === option && styles.correctOption,
                                                    showResults && seletedOptions[index] === optionIndex && 
                                                        item.options[seletedOptions[index]] !== item.correctAnswer && 
                                                        styles.wrongOption
                                                ]}
                                                onPress={() => OnHandleOptionSelect(index, optionIndex)}
                                                disabled={showResults}
                                            >
                                                <View style={[
                                                    styles.optionLabelContainer,
                                                    seletedOptions[index] === optionIndex && styles.selectedOptionLabel,
                                                    showResults && item.correctAnswer === option && styles.correctOptionLabel,
                                                    showResults && seletedOptions[index] === optionIndex && 
                                                        item.options[seletedOptions[index]] !== item.correctAnswer && 
                                                        styles.wrongOptionLabel
                                                ]}>
                                                    <Text style={[
                                                        styles.optionLabelText,
                                                        seletedOptions[index] === optionIndex && styles.selectedOptionLabelText,
                                                        showResults && item.correctAnswer === option && styles.correctOptionLabelText,
                                                        showResults && seletedOptions[index] === optionIndex && 
                                                            item.options[seletedOptions[index]] !== item.correctAnswer && 
                                                            styles.wrongOptionLabelText
                                                    ]}>{getOptionLetterLabel(optionIndex)}</Text>
                                                </View>
                                                <Text style={[
                                                    styles.optionText,
                                                    seletedOptions[index] === optionIndex && styles.selectedOptionText,
                                                    showResults && item.correctAnswer === option && styles.correctOptionText,
                                                    showResults && seletedOptions[index] === optionIndex && 
                                                        item.options[seletedOptions[index]] !== item.correctAnswer && 
                                                        styles.wrongOptionText
                                                ]}>{option}</Text>
                                                
                                                {showResults && item.correctAnswer === option && (
                                                    <View style={styles.correctIndicator}>
                                                        <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                                    </View>
                                                )}
                                                
                                                {showResults && seletedOptions[index] === optionIndex && 
                                                    item.options[seletedOptions[index]] !== item.correctAnswer && (
                                                    <View style={styles.wrongIndicator}>
                                                        <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))
                        }
                        
                        {/* Results Summary Card */}
                        <View style={styles.resultsSummaryCard}>
                            <View style={styles.resultsSummaryHeader}>
                                <Text style={styles.resultsSummaryTitle}>Tổng kết</Text>
                            </View>
                            
                            <View style={styles.progressContainer}>
                                <AnimatedCircularProgress
                                    size={120}
                                    width={10}
                                    backgroundWidth={10}
                                    fill={fillScreen}
                                    tintColor="#0085ff"
                                    backgroundColor="rgba(0, 133, 255, 0.15)"
                                    rotation={0}
                                    duration={2000}
                                    lineCap="round"
                                >
                                    {(fillValue) => (
                                        <View style={styles.scoreValueContainer}>
                                            <Text style={styles.scoreValue}>
                                                {Math.round((fillValue / 100) * MAX_POINTS_SCREEN)}
                                            </Text>
                                            <Text style={styles.scoreMaxValue}>/100</Text>
                                        </View>
                                    )}
                                </AnimatedCircularProgress>
                            </View>
                            
                            <View style={styles.statsContainer}>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#EEF6FF' }]}>
                                            <Ionicons name="checkmark-done" size={16} color="#0085ff" />
                                        </View>
                                        <View>
                                            {renderTextFinishScreen()}
                                            <Text style={styles.statLabel}>Hoàn thành</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#EEF6FF' }]}>
                                            <FontAwesome5 name="question" size={16} color="#0085ff" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>{questions.length}</Text>
                                            <Text style={styles.statLabel}>Tổng câu hỏi</Text>
                                        </View>
                                    </View>
                                </View>
                                
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#F1F8ED' }]}>
                                            <FontAwesome5 name="check" size={16} color="#3db655" />
                                        </View>
                                        <View>
                                            {renderTextCorrectScreen()}
                                            <Text style={styles.statLabel}>Câu đúng</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#FFEFEF' }]}>
                                            <FontAwesome5 name="times" size={16} color="#FF5151" />
                                        </View>
                                        <View>
                                            {renderTextWrongScreen()}
                                            <Text style={styles.statLabel}>Câu sai</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            
                            <View style={styles.actionsContainer}>
                                {showResults ? (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => onRetry()}
                                    >
                                        <LinearGradient
                                            colors={['#0085ff', '#4FACFE']}
                                            style={styles.actionButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <AntDesign name="reload1" size={20} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Làm lại</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => OnHandleSubmit()}
                                    >
                                        <LinearGradient
                                            colors={['#0085ff', '#4FACFE']}
                                            style={styles.actionButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <MaterialCommunityIcons name="check-all" size={20} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Nộp bài</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                    
                    {modalResultVisible && renderResultModal()}
                </SafeAreaView>
            )}
        </>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'Raleway_700Bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
        color: '#64748B',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        paddingBottom: 40,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionNumberBadge: {
        backgroundColor: '#EEF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    questionNumberText: {
        color: '#0085ff',
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
    },
    questionStatusContainer: {
        flexDirection: 'row',
    },
    correctBadge: {
        backgroundColor: '#3db655',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    incorrectBadge: {
        backgroundColor: '#FF5151',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    missedBadge: {
        backgroundColor: '#9CA3AF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        marginLeft: 4,
    },
    questionText: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#1E293B',
        lineHeight: 24,
        marginBottom: 20,
    },
    optionsContainer: {
        marginTop: 5,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        position: 'relative',
    },
    optionLabelContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLabelText: {
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
        color: '#64748B',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito_500Medium',
        color: '#334155',
    },
    selectedOption: {
        backgroundColor: '#EEF6FF',
        borderColor: '#0085ff',
    },
    selectedOptionLabel: {
        backgroundColor: '#0085ff',
    },
    selectedOptionLabelText: {
        color: '#FFFFFF',
    },
    selectedOptionText: {
        color: '#0085ff',
        fontFamily: 'Nunito_600SemiBold',
    },
    correctOption: {
        backgroundColor: '#F1F8ED',
        borderColor: '#3db655',
    },
    correctOptionLabel: {
        backgroundColor: '#3db655',
    },
    correctOptionLabelText: {
        color: '#FFFFFF',
    },
    correctOptionText: {
        color: '#3db655',
        fontFamily: 'Nunito_600SemiBold',
    },
    wrongOption: {
        backgroundColor: '#FFEFEF',
        borderColor: '#FF5151',
    },
    wrongOptionLabel: {
        backgroundColor: '#FF5151',
    },
    wrongOptionLabelText: {
        color: '#FFFFFF',
    },
    wrongOptionText: {
        color: '#FF5151',
        fontFamily: 'Nunito_600SemiBold',
    },
    correctIndicator: {
        position: 'absolute',
        right: 14,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#3db655',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wrongIndicator: {
        position: 'absolute',
        right: 14,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FF5151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsSummaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    resultsSummaryHeader: {
        marginBottom: 20,
    },
    resultsSummaryTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#1E293B',
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreValue: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: '#0085ff',
    },
    scoreMaxValue: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#0085ff',
    },
    statsContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statValue: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#0085ff',
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Nunito_500Medium',
        color: '#64748B',
    },
    actionsContainer: {
        alignItems: 'center',
    },
    actionButton: {
        width: '100%',
        overflow: 'hidden',
        borderRadius: 12,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredView: {
        width: width * 0.9,
        maxWidth: 350,
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    modalHeader: {
        backgroundColor: '#0085ff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeaderText: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    modalScoreContainer: {
        alignItems: 'center',
        paddingVertical: 25,
    },
    modalStatsContainer: {
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    modalStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
    },
    modalActionsContainer: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '48%',
    },
    retryButton: {
        backgroundColor: '#0085ff',
    },
    reviewButton: {
        backgroundColor: '#3db655',
    },
    modalActionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        marginLeft: 8,
    },
    questionImageContainer: {
        width: '100%',
        marginVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingVertical: 8,
    },
    questionImage: {
        width: width * 0.85,
        height: width * 0.6,
        borderRadius: 8,
    },
})

export default CourseQuizzScreen;