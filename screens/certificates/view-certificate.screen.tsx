import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Share,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  ToastAndroid,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { COLORS, FONTS, SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

// Define types for certificate data
interface Certificate {
  _id: string;
  userId: string;
  courseId: string;
  issueDate: string;
  userNameAtIssue: string;
  courseNameAtIssue: string;
  mentorNameAtIssue: string;
  createdAt: string;
  updatedAt: string;
}

// Define types for navigation and route params
type CourseType = {
  title: string;
};

const { width, height } = Dimensions.get('window');

// Component for creating the diagonal pattern background
const DiagonalPattern = ({ rotation = 0, opacity = 0.12 }) => {
  const lines = [];
  const spacing = 15;
  const count = 30;
  
  for (let i = -count; i < count; i++) {
    const offset = i * spacing;
    lines.push(
      <Line
        key={`line-${i}`}
        x1={offset}
        y1="0"
        x2={offset + 300}
        y2="300"
        stroke="#335EF7"
        strokeWidth="0.75"
        opacity={0.54}
      />
    );
  }
  
  return (
    <View style={[styles.patternContainer, { opacity, transform: [{ rotate: `${rotation}deg` }] }]}>
      <Svg height="100%" width="100%" viewBox="0 0 300 300">
        {lines}
      </Svg>
    </View>
  );
};

// Certificate border decoration
const BorderDecoration = () => {
  return (
    <View style={styles.borderDecoration}>
      <View style={[styles.cornerDecoration, styles.topLeft]}>
        <MaterialCommunityIcons name="certificate" size={20} color={COLORS.primary} />
      </View>
      <View style={[styles.cornerDecoration, styles.topRight]}>
        <MaterialCommunityIcons name="certificate" size={20} color={COLORS.primary} />
      </View>
      <View style={[styles.cornerDecoration, styles.bottomLeft]}>
        <MaterialCommunityIcons name="certificate" size={20} color={COLORS.primary} />
      </View>
      <View style={[styles.cornerDecoration, styles.bottomRight]}>
        <MaterialCommunityIcons name="certificate" size={20} color={COLORS.primary} />
      </View>
    </View>
  );
};

// Add this verification URL generation function before the CertificateScreen component
const getVerificationUrl = (certificateId: string) => {
  // Base URL of your verification endpoint - replace with your actual domain
  const baseUrl = 'https://elera-lms.com/verify-certificate';
  return `${baseUrl}/${certificateId}`;
};

const CertificateScreen = () => {
  const viewShotRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Get params from navigation
  const params = useLocalSearchParams();
  
  // Parse certificate data
  const [certificateData, setCertificateData] = useState<Certificate | null>(null);
  const [courseData, setCourseData] = useState<CourseType>({ title: 'Loading...' });
  const [userName, setUserName] = useState<string>('');
  
  useEffect(() => {
    try {
      // Parse certificate data from params
      if (params.certificate) {
        const certificate = JSON.parse(params.certificate as string);
        setCertificateData(certificate);
      }
      
      // Parse course data from params
      if (params.course) {
        const course = JSON.parse(params.course as string);
        setCourseData(course);
      }
      
      // Get username from params
      if (params.userName) {
        setUserName(params.userName as string);
      }
    } catch (error) {
      console.error('Error parsing params:', error);
    }
  }, [params]);

  // Format issue date
  const formatIssueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const handleShare = async () => {
    try {
      if (viewShotRef.current) {
        setIsDownloading(true);
        // Capture the certificate as an image
        const uri = await (viewShotRef.current as any).capture();
        setIsDownloading(false);
        
        // Share the image
        await Share.share({
          message: `I've completed ${courseData?.title} and received my certificate!` +
                  `${certificateData ? ` Certificate ID: ${certificateData._id}` : ''}`,
          title: 'My Course Certificate',
          url: uri
        });
      }
    } catch (error) {
      setIsDownloading(false);
      console.error('Error sharing certificate:', error);
      Alert.alert('Error', 'Failed to share certificate. Please try again.');
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage to download the certificate",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check permissions when component mounts
    const checkInitialPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          setPermissionGranted(result);
        } else {
          const { status } = await MediaLibrary.getPermissionsAsync();
          setPermissionGranted(status === 'granted');
        }
      } catch (error) {
        console.log('Error checking initial permissions:', error);
      }
    };

    checkInitialPermissions();
  }, []); // Empty dependency array ensures this only runs once on mount

  const handleDownload = async () => {
    try {
      // Set loading state only once at the beginning
      setIsDownloading(true);
      
      // Handle permissions outside of any state-setting logic
      let permissionGranted = false;
      
      // Different handling for Android and iOS
      if (Platform.OS === 'android') {
        try {
          // First check if we already have permission
          permissionGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          // Only request if we don't already have it
          if (!permissionGranted) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: "Storage Permission",
                message: "App needs access to your storage to download the certificate",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            
            permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          }
          
          if (!permissionGranted) {
            ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT);
            setIsDownloading(false);
            return;
          }
        } catch (permissionError) {
          console.error("Permission request error:", permissionError);
        }
      } else {
        // For iOS, check permissions first
        const { status } = await MediaLibrary.getPermissionsAsync();
        permissionGranted = status === 'granted';
        
        // Request only if not granted
        if (!permissionGranted) {
          const request = await MediaLibrary.requestPermissionsAsync();
          permissionGranted = request.status === 'granted';
        }
        
        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'Storage permission is required to save the certificate to your device.',
            [{ text: 'OK' }]
          );
          setIsDownloading(false);
          return;
        }
      }
      
      // Check for valid ref
      if (!viewShotRef.current) {
        throw new Error("Certificate view reference not available");
      }
      
      // Show capturing message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Capturing certificate...', ToastAndroid.SHORT);
      }
      
      // Capture the certificate as an image
      const uri = await (viewShotRef.current as any).capture();
      
      // Create a unique filename
      const certId = certificateData?._id || 'certificate';
      const timestamp = Date.now();
      const filename = `certificate_${certId.replace(/\W/g, '')}_${timestamp}.png`;
      
      // Try different methods based on platform
      if (Platform.OS === 'android') {
        // For Android: Use MediaLibrary to save to gallery
        try {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('Certificates', asset, false);
          
          // Show success notification
          ToastAndroid.show('Certificate saved to gallery!', ToastAndroid.LONG);
          
          // Show alert with view option
          Alert.alert(
            'Certificate Saved!',
            'Your certificate has been saved to your device gallery in the "Certificates" album.',
            [
              { 
                text: 'View', 
                onPress: async () => {
                  // Try to share/open the file to show it
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                  }
                } 
              },
              { text: 'OK' }
            ]
          );
        } catch (saveError) {
          console.error('Gallery save error:', saveError);
          
          // Fallback: Use sharing API
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Save Certificate'
            });
          } else {
            throw new Error("No saving method available");
          }
        }
      } else {
        // For iOS: Save to media library
        try {
          // First, copy to app documents
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          
          await FileSystem.copyAsync({
            from: uri,
            to: fileUri
          });
          
          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          
          Alert.alert(
            'Certificate Downloaded',
            'Your certificate has been saved to your Photos app.',
            [{ text: 'OK' }]
          );
        } catch (iosError) {
          console.error('iOS save error:', iosError);
          
          // Fallback: Use sharing
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              UTI: 'public.image',
              dialogTitle: 'Save Certificate'
            });
          } else {
            throw new Error("No sharing method available on iOS");
          }
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      
      Alert.alert(
        'Download Error',
        'Failed to download the certificate. Would you like to try sharing it instead?',
        [
          { 
            text: 'Share Instead', 
            onPress: handleShare 
          },
          { text: 'Cancel' }
        ]
      );
    } finally {
      // Always reset loading state
      setIsDownloading(false);
    }
  };

  // Inside the CertificateScreen component, add this function to handle verification link
  const handleVerificationLink = (certificateId: string) => {
    const url = getVerificationUrl(certificateId);
    Linking.openURL(url).catch(err => 
      console.error('Error opening verification URL:', err)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate</Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          disabled={isDownloading}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Certificate Content */}
      <View style={styles.certificateWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={styles.viewShot}
          >
            <View style={styles.certificateContainer}>
              {/* Pattern Background */}
              <View style={styles.patternBackground}>
                <DiagonalPattern rotation={0} opacity={0.05} />
                <DiagonalPattern rotation={90} opacity={0.05} />
                <DiagonalPattern rotation={180} opacity={0.05} />
                <DiagonalPattern rotation={270} opacity={0.05} />
              </View>
              
              {/* Decorative border */}
              <BorderDecoration />
              
              <View style={styles.certificateContent}>
                {/* Certificate Logo */}
                <View style={styles.certificateHeader}>
                  <LinearGradient
                    colors={['#335EF7', '#5F82FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.certificateLogo}
                  >
                    <Image 
                      source={require('../../assets/images/logo.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                  <Text style={styles.certificateTitle}>Certificate of Completion</Text>
                  <Text style={styles.certificateSubtitle}>Presented to</Text>
                </View>
                
                {/* User Name */}
                <Text style={styles.userName}>{userName || 'Student'}</Text>
                
                {/* Course Info */}
                <View style={styles.courseInfoContainer}>
                  <Text style={styles.courseCompletion}>For the successful completion of</Text>
                  <Text style={styles.courseTitle}>{courseData?.title}</Text>
                  <Text style={styles.certDetails}>
                    Issued on {certificateData ? formatIssueDate(certificateData.issueDate) : formatIssueDate(new Date().toString())}
                  </Text>
                  <Text style={styles.certDetails}>ID: {certificateData?._id || 'Not Available'}</Text>
                  
                  {/* Add verification section */}
                  {certificateData && (
                    <View style={styles.verificationContainer}>
                      <View style={styles.qrContainer}>
                        <QRCode
                          value={getVerificationUrl(certificateData._id)}
                          size={70}
                          color={COLORS.primary}
                          backgroundColor="white"
                        />
                      </View>
                      <Text style={styles.verifyText}>Verify this certificate at:</Text>
                      <TouchableOpacity 
                        onPress={() => handleVerificationLink(certificateData._id)}
                      >
                        <Text style={styles.verifyLink}>{getVerificationUrl(certificateData._id)}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {/* Signature */}
                <View style={styles.signatureSection}>
                  <View style={styles.signatureContainer}>
                    <View style={styles.signatureWrapper}>
                      <LinearGradient
                        colors={['#335EF7', '#5F82FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.signature}
                      />
                    </View>
                    <View style={styles.signatureInfo}>
                      <Text style={styles.signatureName}>
                      Instructor: {certificateData?.mentorNameAtIssue || 'Course Instructor'}
                      </Text>
                      <View style={styles.divider} />
                      <Text style={styles.signatureRole}>Elera Courses Manager</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ViewShot>
        </ScrollView>
      </View>
      
      {/* Download Button */}
      <View style={styles.bottomSheet}>
        <TouchableOpacity 
          style={[
            styles.downloadButton,
            isDownloading && styles.downloadButtonDisabled
          ]}
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.downloadButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.downloadButtonText}>Download Certificate</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.gray,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: SIZES.lg,
    color: COLORS.text.primary,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  certificateWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingBottom: 90,
  },
  certificateContainer: {
    width: '100%',
    minHeight: height - 250, // Ensure it takes up most of the screen height
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(51, 94, 247, 0.1)',
    ...SHADOWS.medium,
  },
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  borderDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cornerDecoration: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
  },
  certificateContent: {
    padding: 44,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: height - 254, // Account for border
  },
  certificateHeader: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  certificateLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  logoImage: {
    width: 36,
    height: 36,
    tintColor: COLORS.white,
  },
  certificateTitle: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: 20,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  certificateSubtitle: {
    fontFamily: FONTS.urbanist.medium,
    fontSize: 12,
    color: COLORS.text.gray,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  userName: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: 24, // Increased font size
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  courseInfoContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  courseCompletion: {
    fontFamily: FONTS.urbanist.medium,
    fontSize: 12,
    color: COLORS.text.gray,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  courseTitle: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: 18,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  certDetails: {
    fontFamily: FONTS.urbanist.medium,
    fontSize: 12,
    color: COLORS.text.gray,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  signatureSection: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 15,
    marginTop: 'auto', // Push to bottom when space available
    paddingTop: 32,
  },
  signatureContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 15,
  },
  signatureWrapper: {
    width: 80,
    height: 40,
    justifyContent: 'center',
  },
  signature: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  signatureInfo: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
  },
  signatureName: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: COLORS.background.gray,
  },
  signatureRole: {
    fontFamily: FONTS.urbanist.medium,
    fontSize: 10,
    color: COLORS.text.gray,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  downloadButtonText: {
    fontFamily: FONTS.urbanist.bold,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  viewShot: {
    backgroundColor: 'transparent',
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  verificationContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    width: '100%',
  },
  qrContainer: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  verifyText: {
    fontSize: 10,
    color: COLORS.text.gray,
    fontFamily: FONTS.urbanist.medium,
    marginBottom: 4,
  },
  verifyLink: {
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: FONTS.urbanist.medium,
    textDecorationLine: 'underline',
  },
});


export default CertificateScreen; 