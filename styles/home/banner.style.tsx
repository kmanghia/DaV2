import { StyleSheet, Dimensions } from "react-native";
import { responsiveWidth } from "react-native-responsive-dimensions";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        height: hp("35%"),
        marginHorizontal: 16,
    },

    slide: { 
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },

    imageContainer: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height: hp("28%"),
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },

    bannerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },

    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: hp("28%"),
        borderRadius: 16,
    },

    bannerContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    bannerTitle: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'Raleway_700Bold',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

    bannerSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    bannerButton: {
        backgroundColor: '#2467EC',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-start',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },

    bannerButtonText: {
        color: 'white',
        fontFamily: 'Nunito_700Bold',
        fontSize: 14,
    },

    background: {
        width: "100%",
        height: hp("27"),
        resizeMode: "stretch",
        zIndex: 1,
    },

    dot: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },

    activeDot: {
        backgroundColor: "#2467EC",
        width: 16,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },

    backgroundView: {
        position: "absolute",
        zIndex: 5,
        paddingHorizontal: 18,
        paddingVertical: 30,
        flexDirection: "row",
        alignItems: "center",
    },

    backgroundViewContainer: {
        width: responsiveWidth(45),
        height: responsiveWidth(30),
        marginTop: -50,
    },

    backgroundViewText: {
        color: "white",
        fontSize: hp("2.7%"),
    },

    backgroundViewOffer: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        marginTop: 5,
    },

    backgroundViewImage: {
        width: wp("38%"),
        height: hp("22%"),
        top: -15,
    },

    backgroundViewButtonContainer: {
        borderWidth: 1.1,
        borderColor: "rgba(255, 255, 255, 0.5)",
        width: 109,
        height: 32,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
    },

    backgroundViewButtonText: {
        color: "#FFFF",
    },
})