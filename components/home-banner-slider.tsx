import { bannerData } from "@/constants/constants";
import { styles } from "@/styles/home/banner.style";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import { Image, View, Text, TouchableOpacity, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

const HomeBannerSlider = () => {
    let [fontsLoaded, fontsError] = useFonts({
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_700Bold,
    })
    if (!fontsLoaded && !fontsError) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Swiper
                dotStyle={styles.dot}
                activeDotStyle={styles.activeDot}
                autoplay={true}
                autoplayTimeout={6}
                showsPagination={true}
                loop={true}
            >
                {bannerData.map((item: BannerDataTypes, index: number) => (
                    <View key={index} style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={item.bannerImageUrl!}
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
                                style={styles.gradientOverlay}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 0.6 }}
                            />
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerTitle}>
                                    Khám phá các khóa học
                                </Text>
                                <Text style={styles.bannerSubtitle}>
                                    Học bất cứ lúc nào, bất cứ nơi đâu
                                </Text>
                                <TouchableOpacity 
                                    style={styles.bannerButton}
                                    onPress={() => router.push("/(tabs)/search")}
                                >
                                    <Text style={styles.bannerButtonText}>Xem ngay</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </Swiper>
        </View>
    )
}

export default HomeBannerSlider;