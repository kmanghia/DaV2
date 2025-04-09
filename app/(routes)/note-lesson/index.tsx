import { MaterialIcons, FontAwesome5, Entypo, Ionicons, AntDesign, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
    Alert, 
    Button, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    StatusBar, 
    KeyboardAvoidingView, 
    Platform, 
    SafeAreaView,
    Modal,
    Keyboard
} from "react-native"
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp
} from "react-native-responsive-screen";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from "axios";
import { URL_SERVER } from "@/utils/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "@/components/loader";
import { LinearGradient } from "expo-linear-gradient";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";

const NoteLesson = () => {
    const actions = {
        CREATE: 'CREATE',
        UPDATE: 'UPDATE'
    }
    const [action, setAction] = useState(actions.CREATE);
    const {courseId, courseDataId, name, nameLesson} = useLocalSearchParams();
    const [modalVisible, setModalVisible] = useState(false);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [notes, setNotes] = useState<{_id: string, subject: string, content: string, createdAt?: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [targetUpdateId, setTargetUpdateId] = useState('');

    let [fontsLoaded, fontError] = useFonts({
        Raleway_600SemiBold,
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold,
    });

    useEffect(() => {
        const subscription = async () => {
            await fetchNotesOfUserInCurrentCourseDataId();
        }
        subscription();
    }, [])

    const fetchNotesOfUserInCurrentCourseDataId = async () => {
        try {
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const response = await axios.get(`${URL_SERVER}/user/get-list-notes?courseId=${courseId}&courseDataId=${courseDataId}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            if(response.data.response){
                setNotes(response.data.response.note);
            }
            setLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    const openModalForCreate = () => {
        setAction(actions.CREATE);
        setSubject('');
        setContent('');
        setModalVisible(true);
    };

    const openModalForUpdate = (id: string) => {
        setAction(actions.UPDATE);
        setTargetUpdateId(id);
        const targetNote = notes.find(note => note._id === id);
        if(targetNote){
            setSubject(targetNote.subject);
            setContent(targetNote.content);
            setModalVisible(true);
        }else{
            console.log("Không tìm thấy ghi chú bạn cần!");
        }
    };

    const onSaveNote = async () => {
        try {
            if (!subject.trim() || !content.trim()) {
                Alert.alert("Thông báo", "Vui lòng nhập đầy đủ chủ đề và nội dung");
                return;
            }
            
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            await axios.post(`${URL_SERVER}/user/create-note-by-courseDataId`, {
                courseId: courseId,
                courseDataId: courseDataId,
                subject: subject,
                content: content
            }, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const response = await axios.get(`${URL_SERVER}/user/get-list-notes?courseId=${courseId}&courseDataId=${courseDataId}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            if(response.data.response){
                setNotes(response.data.response.note);
            }
            setSubject('');
            setContent('');
            setLoading(false);
        } catch (error) {
            console.log(error);
        }finally{
            setModalVisible(false);
        }
    }

    const onOpenAlertDialog = (id: string) => {
        Alert.alert(
            "Xác nhận xóa", 
            "Bạn thực sự muốn xóa ghi chú này?", 
            [
                {
                    text: "Hủy bỏ",
                    style: "cancel",
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => onDeleteSingleNote(id)
                }
            ]
        )
    }

    const onDeleteSingleNote = async (id: string) => {
        try {
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            await axios.delete(`${URL_SERVER}/user/delete-single-note-id-in-note?courseId=${courseId}&courseDataId=${courseDataId}&singleNoteIdInNote=${id}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const response = await axios.get(`${URL_SERVER}/user/get-list-notes?courseId=${courseId}&courseDataId=${courseDataId}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            if(response.data.response){
                setNotes(response.data.response.note);
            }
            setLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    const onUpdateSingleNote = async (id: string) => {
        try {
            if (!subject.trim() || !content.trim()) {
                Alert.alert("Thông báo", "Vui lòng nhập đầy đủ chủ đề và nội dung");
                return;
            }
            
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            await axios.put(`${URL_SERVER}/user/update-single-note-id-in-note`,{
                courseId: courseId,
                courseDataId: courseDataId,
                subject: subject,
                content: content,
                singleNoteId: id
            } ,{
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            });
            const response = await axios.get(`${URL_SERVER}/user/get-list-notes?courseId=${courseId}&courseDataId=${courseDataId}`, {
                headers: {
                    'access-token': accessToken,
                    'refresh-token': refreshToken
                }
            })
            if(response.data.response){
                setNotes(response.data.response.note);
            }
            setAction(actions.CREATE);
            setTargetUpdateId('');
            setSubject('');
            setContent('');
            setLoading(false);
        } catch (error) {
            console.log(error);
        } finally {
            setModalVisible(false);
        }
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return '';
        }
    }

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <>
            <StatusBar barStyle="dark-content" />
            { loading ?
                (
                    <Loader/>
                ):(
                    <GestureHandlerRootView style={styles.container}>
                        <SafeAreaView style={styles.container}>
                            <View style={styles.header}>
                                <TouchableOpacity 
                                    style={styles.backButton}
                                    onPress={() => router.back()}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#333" />
                                </TouchableOpacity>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.courseTitle}>{name}</Text>
                                    <Text style={styles.lessonTitle}>{nameLesson}</Text>
                                </View>
                            </View>
                            
                            <ScrollView 
                                style={styles.scrollView}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.notesHeader}>
                                    <Text style={styles.notesTitle}>Ghi chú của bạn</Text>
                                    <View style={styles.notesCount}>
                                        <Text style={styles.notesCountText}>
                                            {notes.length} ghi chú
                                        </Text>
                                    </View>
                                </View>
                                
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={openModalForCreate}
                                >
                                    <LinearGradient
                                        colors={['#0085ff', '#4FACFE']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.createButtonGradient}
                                    >
                                        <Ionicons name="add" size={22} color="white" />
                                        <Text style={styles.createButtonText}>Tạo ghi chú mới</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                <View style={styles.notesContainer}>
                                    {notes.length > 0 ? (
                                        notes.map((note) => (
                                            <View key={note._id} style={styles.noteCard}>
                                                <View style={styles.noteHeader}>
                                                    <Text style={styles.noteTitle} numberOfLines={1}>{note.subject}</Text>
                                                    {note.createdAt && (
                                                        <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                                                    )}
                                                </View>
                                                <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                                                <View style={styles.noteActions}>
                                                    <TouchableOpacity
                                                        style={styles.noteActionButton}
                                                        onPress={() => openModalForUpdate(note._id)}
                                                    >
                                                        <Feather name="edit-2" size={18} color="#0085ff" />
                                                        <Text style={styles.noteActionText}>Sửa</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.noteActionButton, styles.deleteButton]}
                                                        onPress={() => onOpenAlertDialog(note._id)}
                                                    >
                                                        <Feather name="trash-2" size={18} color="#FF5151" />
                                                        <Text style={[styles.noteActionText, styles.deleteText]}>Xóa</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.emptyContainer}>
                                            <View style={styles.emptyIconContainer}>
                                                <Feather name="book-open" size={60} color="#DFE6F0" />
                                            </View>
                                            <Text style={styles.emptyTitle}>Chưa có ghi chú nào</Text>
                                            <Text style={styles.emptyText}>
                                                Tạo ghi chú đầu tiên để lưu lại những điều quan trọng trong bài học này
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                            
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalVisible}
                                onRequestClose={() => {
                                    setModalVisible(false);
                                }}
                            >
                                <TouchableOpacity 
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPress={() => Keyboard.dismiss()}
                                >
                                    <KeyboardAvoidingView 
                                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                        style={styles.modalContainer}
                                    >
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalIndicator} />
                                            
                                            <Text style={styles.bottomSheetTitle}>
                                                {action === actions.CREATE ? 'Tạo ghi chú mới' : 'Chỉnh sửa ghi chú'}
                                            </Text>
                                            
                                            <View style={styles.formGroup}>
                                                <Text style={styles.formLabel}>Chủ đề</Text>
                                                <TextInput 
                                                    value={subject}
                                                    onChangeText={(v) => setSubject(v)}
                                                    placeholder="Nhập chủ đề ghi chú"
                                                    style={styles.formInput}
                                                    placeholderTextColor="#A0AEC0"
                                                />
                                            </View>
                                            
                                            <View style={styles.formGroup}>
                                                <Text style={styles.formLabel}>Nội dung</Text>
                                                <TextInput 
                                                    value={content}
                                                    onChangeText={(v) => setContent(v)}
                                                    placeholder="Nhập nội dung ghi chú"
                                                    style={[styles.formInput, styles.formTextarea]}
                                                    multiline={true}
                                                    numberOfLines={5}
                                                    placeholderTextColor="#A0AEC0"
                                                />
                                            </View>
                                            
                                            <View style={styles.formActions}>
                                                <TouchableOpacity 
                                                    style={styles.cancelButton}
                                                    onPress={() => setModalVisible(false)}
                                                >
                                                    <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                                                </TouchableOpacity>
                                                
                                                <TouchableOpacity 
                                                    style={styles.saveButton}
                                                    onPress={() => action === actions.CREATE ? onSaveNote() : onUpdateSingleNote(targetUpdateId)}
                                                >
                                                    <LinearGradient
                                                        colors={['#0085ff', '#4FACFE']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={styles.saveButtonGradient}
                                                    >
                                                        <Text style={styles.saveButtonText}>
                                                            {action === actions.CREATE ? 'Tạo ghi chú' : 'Lưu thay đổi'}
                                                        </Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </KeyboardAvoidingView>
                                </TouchableOpacity>
                            </Modal>
                        </SafeAreaView>
                    </GestureHandlerRootView>
                )
            }
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#0085ff',
        marginBottom: 4,
    },
    lessonTitle: {
        fontSize: 18,
        fontFamily: 'Raleway_700Bold',
        color: '#1A202C',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    notesTitle: {
        fontSize: 20,
        fontFamily: 'Raleway_700Bold',
        color: '#1A202C',
    },
    notesCount: {
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    notesCountText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#4A5568',
    },
    createButton: {
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        marginLeft: 8,
    },
    notesContainer: {
        marginBottom: 20,
    },
    noteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteTitle: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#1A202C',
        flex: 1,
    },
    noteDate: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: '#718096',
        marginLeft: 8,
    },
    noteContent: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#4A5568',
        lineHeight: 20,
    },
    noteActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
    },
    noteActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F7FAFF',
        marginLeft: 12,
    },
    noteActionText: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#0085ff',
    },
    deleteButton: {
        backgroundColor: '#FFF5F5',
    },
    deleteText: {
        color: '#FF5151',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F7FAFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: '#4A5568',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#718096',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingTop: 16,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#CBD5E0',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontFamily: 'Raleway_700Bold',
        color: '#1A202C',
        marginBottom: 24,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#4A5568',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: '#1A202C',
    },
    formTextarea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#718096',
    },
    saveButton: {
        flex: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#FFFFFF',
    },
});

export default NoteLesson;