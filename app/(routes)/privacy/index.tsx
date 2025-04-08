import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

const PrivacyPolicyScreen = () => {
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
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Background Decoration */}
      <View style={styles.backgroundDecoration}>
        <LinearGradient
          colors={['rgba(36, 103, 236, 0.08)', 'rgba(36, 103, 236, 0.01)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.subtitle}>Cập nhật lần cuối: 10/04/2025</Text>
          
          <Text style={styles.paragraph}>
            Chào mừng bạn đến với ứng dụng học trực tuyến của chúng tôi. Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và đảm bảo quyền riêng tư của bạn được tôn trọng.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin chúng tôi thu thập</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Thông tin cá nhân:</Text> Khi bạn đăng ký tài khoản, chúng tôi thu thập tên, địa chỉ email, và mật khẩu của bạn.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Thông tin sử dụng:</Text> Chúng tôi thu thập dữ liệu về cách bạn tương tác với ứng dụng, bao gồm các khóa học bạn truy cập, thời gian học tập, và tiến độ học tập.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Thông tin thanh toán:</Text> Khi bạn mua khóa học, chúng tôi thu thập thông tin thanh toán cần thiết để xử lý giao dịch của bạn.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Cách chúng tôi sử dụng thông tin</Text>
          <Text style={styles.paragraph}>
            • Cung cấp và duy trì dịch vụ học trực tuyến
          </Text>
          <Text style={styles.paragraph}>
            • Cá nhân hóa trải nghiệm học tập của bạn
          </Text>
          <Text style={styles.paragraph}>
            • Gửi thông báo về khóa học, cập nhật và khuyến mãi
          </Text>
          <Text style={styles.paragraph}>
            • Phân tích và cải thiện ứng dụng của chúng tôi
          </Text>
          <Text style={styles.paragraph}>
            • Xử lý thanh toán và hoàn tiền
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Bảo mật thông tin</Text>
          <Text style={styles.paragraph}>
            Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin cá nhân của bạn khỏi mất mát, sử dụng sai mục đích, truy cập trái phép, tiết lộ, thay đổi hoặc phá hủy. Các biện pháp này bao gồm mã hóa dữ liệu, hệ thống xác thực người dùng, và kiểm soát truy cập.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Chia sẻ thông tin</Text>
          <Text style={styles.paragraph}>
            Chúng tôi không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba mà không có sự đồng ý của bạn, ngoại trừ trong các trường hợp sau:
          </Text>
          <Text style={styles.paragraph}>
            • Với các đối tác cung cấp dịch vụ hỗ trợ hoạt động của ứng dụng
          </Text>
          <Text style={styles.paragraph}>
            • Khi cần tuân thủ pháp luật hoặc bảo vệ quyền lợi của chúng tôi
          </Text>
          <Text style={styles.paragraph}>
            • Trong trường hợp sáp nhập, mua lại hoặc bán tài sản
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Quyền của bạn</Text>
          <Text style={styles.paragraph}>
            Bạn có quyền:
          </Text>
          <Text style={styles.paragraph}>
            • Truy cập, sửa đổi hoặc xóa thông tin cá nhân của bạn
          </Text>
          <Text style={styles.paragraph}>
            • Hạn chế hoặc phản đối việc xử lý dữ liệu của bạn
          </Text>
          <Text style={styles.paragraph}>
            • Yêu cầu chuyển giao dữ liệu của bạn
          </Text>
          <Text style={styles.paragraph}>
            • Rút lại sự đồng ý của bạn bất kỳ lúc nào
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookie và công nghệ theo dõi</Text>
          <Text style={styles.paragraph}>
            Chúng tôi sử dụng cookie và các công nghệ tương tự để cải thiện trải nghiệm của bạn, phân tích xu hướng sử dụng, quản lý trang web, và thu thập thông tin nhân khẩu học về cơ sở người dùng của chúng tôi. Bạn có thể kiểm soát cách cookie được sử dụng thông qua cài đặt trình duyệt của bạn.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Thay đổi chính sách bảo mật</Text>
          <Text style={styles.paragraph}>
            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào bằng cách đăng chính sách mới trên ứng dụng và/hoặc gửi email thông báo cho bạn.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Liên hệ</Text>
          <Text style={styles.paragraph}>
            Nếu bạn có bất kỳ câu hỏi hoặc quan ngại nào về chính sách bảo mật của chúng tôi, vui lòng liên hệ với chúng tôi qua:
          </Text>
          <Text style={styles.paragraph}>
            Email: lam47788@gmail.com
          </Text>
          <Text style={styles.paragraph}>
            Điện thoại: (+84) 843 016 069
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 All Rights Reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "white",
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#333333",
  },
  headerRight: {
    width: 40,
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: -1,
  },
  gradient: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#666666",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#2467EC",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#444444",
    lineHeight: 24,
    marginBottom: 8,
  },
  bold: {
    fontFamily: "Nunito_700Bold",
    color: "#333333",
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#9CA3AF",
  },
});

export default PrivacyPolicyScreen; 