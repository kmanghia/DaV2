import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import axios from "axios";
import { URL_SERVER } from "@/utils/url";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
}

const FAQScreen = () => {
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${URL_SERVER}/get-layout/FAQ`);
        if (response.data && response.data.layout && response.data.layout.faq) {
          setFaqData(response.data.layout.faq);
        }
        setLoading(false);
      } catch (error) {
        console.log("Error fetching FAQ data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleAccordion = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Các câu hỏi thường gặp</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2467EC" />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {faqData.length > 0 ? (
            <View style={styles.faqContainer}>
              {faqData.map((item) => (
                <View key={item._id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.questionContainer}
                    onPress={() => toggleAccordion(item._id)}
                  >
                    <View style={styles.questionContent}>
                      <View style={styles.iconContainer}>
                        <MaterialIcons name="question-answer" size={20} color="#2467EC" />
                      </View>
                      <Text style={styles.questionText}>{item.question}</Text>
                    </View>
                    <AntDesign
                      name={expandedId === item._id ? "minuscircle" : "pluscircle"}
                      size={18}
                      color="#2467EC"
                    />
                  </TouchableOpacity>
                  
                  {expandedId === item._id && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="help-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyText}>Không có câu hỏi nào</Text>
              <Text style={styles.emptySubtext}>
                Hiện tại chưa có câu hỏi thường gặp nào được thêm vào
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 45,

  },
  headerTitle: {
    marginTop: 45,
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#333333",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  faqContainer: {
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  questionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  questionText: {
    flex: 1,
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#333333",
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    
  },
  answerText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#666666",
    lineHeight: 22,
    marginTop: 20

  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#666666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
  },
});

export default FAQScreen; 