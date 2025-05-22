import { URL_IMAGES, URL_SERVER } from "@/utils/url";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import { Toast } from "react-native-toast-notifications";
import { AntDesign } from "@expo/vector-icons";

const styles = StyleSheet.create({
    button: {
        width: widthPercentageToDP("35%"),
        height: 40,
        backgroundColor: "#2467EC",
        marginVertical: 10,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    pinnedContainer: {
        backgroundColor: "#f9fff9",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontWeight: "600",
        fontSize: 14,
        color: "#333",
    },
    time: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    question: {
        fontSize: 15,
        color: "#333",
        marginBottom: 15,
        lineHeight: 22,
    },
    repliesContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    repliesTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
        color: "#444",
    },
    replyItem: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    replyHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    replyAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    replyUsername: {
        fontWeight: "600",
        fontSize: 13,
        color: "#333",
    },
    replyTime: {
        fontSize: 11,
        color: "#666",
        marginTop: 2,
    },
    replyText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 38,
        lineHeight: 20,
    },
    replyButton: {
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "#2467EC",
        borderRadius: 4,
        marginTop: 5,
    },
    replyButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    replyInputContainer: {
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        textAlignVertical: "top",
        fontSize: 14,
        color: "#333",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: "#2467EC",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 4,
        marginRight: 10,
    },
    disabledButton: {
        backgroundColor: "#a0a0a0",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    cancelButton: {
        backgroundColor: "#f0f0f0",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 4,
    },
    cancelButtonText: {
        color: "#666",
        fontSize: 14,
        fontWeight: "500",
    },
});

// Import format function directly to avoid module not found error
const format = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return "just now";
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    // Convert to days
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    // Convert to months
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    
    // Convert to years
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
};

interface QuestionCardProps {
    item: {
        _id: string;
        user: any;
        question: string;
        questionReplies: any[];
        createdAt: string;
        isPinned?: boolean;
    };
    fetchCourseContent: () => void;
    courseData: any;
    contentId: string;
}

const QuestionsCard = ({ item, fetchCourseContent, courseData, contentId }: QuestionCardProps) => {
    const [open, setOpen] = useState(false);
    const [reply, setReply] = useState("");
    const [showReplies, setShowReplies] = useState(false);
    const [answer, setAnswer] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) {
            Toast.show("Vui lòng nhập câu trả lời", {
                type: "warning",
                placement: "bottom",
                duration: 3000,
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const accessToken = await AsyncStorage.getItem("access_token");
            const refreshToken = await AsyncStorage.getItem("refresh_token");

            await axios.put(
                `${URL_SERVER}/add-answer`,
                {
                    answer,
                    courseId: courseData._id,
                    contentId,
                    questionId: item._id,
                },
                {
                    headers: {
                        "access-token": accessToken,
                        "refresh-token": refreshToken,
                    },
                }
            );

            Toast.show("Đã gửi câu trả lời thành công", {
                type: "success",
                placement: "bottom",
                duration: 3000,
            });

            setAnswer("");
            setIsReplying(false);
            fetchCourseContent();
        } catch (error) {
            console.log("Error submitting answer:", error);
            Toast.show("Có lỗi xảy ra khi gửi câu trả lời", {
                type: "error",
                placement: "bottom",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[
            styles.container,
            item.isPinned && styles.pinnedContainer
        ]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image
                        source={{
                            uri: item?.user?.avatar?.url
                                ? `${URL_IMAGES}/${item.user.avatar.url}`
                                : "https://ui-avatars.com/api/?name=User",
                        }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.username}>{item?.user?.name || "Học viên"}</Text>
                        <Text style={styles.time}>{format(item?.createdAt)}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.question}>{item?.question}</Text>

            {item?.questionReplies?.length > 0 && (
                <View style={styles.repliesContainer}>
                    <Text style={styles.repliesTitle}>Trả lời:</Text>
                    {item.questionReplies.map((reply: any, index: number) => (
                        <View key={index} style={styles.replyItem}>
                            <View style={styles.replyHeader}>
                                <Image
                                    source={{
                                        uri: reply?.user?.avatar?.url
                                            ? `${URL_IMAGES}/${reply.user.avatar.url}`
                                            : "https://ui-avatars.com/api/?name=User",
                                    }}
                                    style={styles.replyAvatar}
                                />
                                <View>
                                    <Text style={styles.replyUsername}>{reply?.user?.name || "Người dùng"}</Text>
                                    <Text style={styles.replyTime}>{format(reply?.createdAt)}</Text>
                                </View>
                            </View>
                            <Text style={styles.replyText}>{reply?.answer}</Text>
                        </View>
                    ))}
                </View>
            )}

            {!isReplying ? (
                <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => setIsReplying(true)}
                >
                    <Text style={styles.replyButtonText}>Trả lời</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.replyInputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập câu trả lời của bạn..."
                        value={answer}
                        onChangeText={setAnswer}
                        multiline
                    />
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                            onPress={handleSubmitAnswer}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? "Đang gửi..." : "Gửi"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setIsReplying(false);
                                setAnswer("");
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}

export default QuestionsCard;