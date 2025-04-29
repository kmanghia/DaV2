import { View, TouchableOpacity, StyleSheet, Text, Animated } from "react-native";
import { BottomTabBarButtonProps, BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { AntDesign, Ionicons, Octicons } from "@expo/vector-icons";
import { 
  widthPercentageToDP as wp
} from "react-native-responsive-screen";
import { useRef, useEffect } from "react";

type RouteNames = "index" 
            | "search/index" 
            | "courses/index"
            | "profile/index"
            | "wishlist/index"
            | "chat/index";

            
const TabBar = ({state, navigation, descriptors}: any) => {
    // Animation references for each tab item
    const tabAnimations = useRef<Animated.Value[]>(
      state.routes.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
      // Animate the selected tab
      Animated.parallel(
        tabAnimations.map((anim, index) => {
          return Animated.timing(anim, {
            toValue: state.index === index ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
          });
        })
      ).start();
    }, [state.index]);

    const icons = {
        ['index']: ({color}: {color: string}) => <Octicons name="home" size={28} color={color} />,
        ['search/index']: ({color}: {color: string}) => <Ionicons name="search" size={28} color={color} />,
        ['courses/index']: ({color}: {color: string}) => <AntDesign name="book" size={28} color={color} />,
        ['profile/index']: ({color}: {color: string}) => <AntDesign name="user" size={28} color={color} />,
        ['wishlist/index']: ({color}: {color: string}) => <AntDesign name="heart" size={28} color={color} />,
        ['chat/index']: ({color}: {color: string}) => <AntDesign name="message1" size={28} color={color} />,
    }
    const activeColor = '#0070e0';
    const inactiveColor = 'rgba(0, 0, 0, 0.5)';

    return (
        <View style={[styles.tabBar]}>
          {state.routes.map((route: any, index: any) => {
            const { options } = descriptors[route.key];
            const routeName = route.name;
                
            const isFocused = state.index === index;
    
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
    
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };
    
            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };
            
            // Animations
            const scale = tabAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2]
            });
            
            const translateY = tabAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -5]
            });
    
            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabBarItem,
                ]}
              >
                <Animated.View 
                  style={[
                    styles.tabContent,
                    { 
                      transform: [
                        { scale },
                        { translateY }
                      ] 
                    }
                  ]}
                >
                  {
                      icons[routeName as RouteNames]?.({
                          color: isFocused ? activeColor : inactiveColor
                      })
                  }
                </Animated.View>
                {isFocused && (
                  <Animated.View 
                    style={[
                      styles.activeIndicator,
                      { 
                        opacity: tabAnimations[index],
                        width: tabAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 20]
                        })
                      }
                    ]} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 5,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 5
    },
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIndicator: {
        height: 3,
        backgroundColor: '#0070e0',
        borderRadius: 3,
        position: 'absolute',
        bottom: 0,
    }
})

export default TabBar;