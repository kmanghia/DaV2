import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatButtonProps {
  onPress: () => void;
  visible?: boolean;
}

const ChatButton = ({ onPress, visible = true }: ChatButtonProps) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const visibilityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Handle initial animation
  useEffect(() => {
    // Initial pop-in animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
      delay: 500,
    }).start();

    // Start pulse animation
    startPulseAnimation();
    
    // Start glow effect animation
    startGlowAnimation();
  }, []);

  // Handle visibility changes
  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: visible ? 1 : 0,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }).start();
  }, [visible]);

  // Animation function for continuous subtle pulsing
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  };
  
  // Animation for glow effect
  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        })
      ])
    ).start();
  };

  // Animation for button press
  const handlePress = () => {
    // Play button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // Call the provided onPress handler
    onPress();
  };

  // Glow effect styles
  const glowStyle = {
    shadowOpacity: glowAnim,
    shadowRadius: glowAnim.interpolate({
      inputRange: [0.3, 1],
      outputRange: [8, 15],
      extrapolate: 'clamp'
    })
  };

  // Combined animation styles
  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) }
    ],
    opacity: visibilityAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    })
  };

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      {/* Outer glow effect */}
      <Animated.View style={[styles.glowEffect, glowStyle]}>
        <TouchableOpacity 
          style={styles.buttonWrapper}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#3378F6', '#2467EC', '#1e5ad0']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
            </View>
            
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  glowEffect: {
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
    borderRadius: 30,
  },
  buttonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default ChatButton; 