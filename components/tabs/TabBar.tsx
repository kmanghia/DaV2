import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { BottomTabBarButtonProps, BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { AntDesign, Ionicons, Octicons } from "@expo/vector-icons";
import { 
  widthPercentageToDP as wp
} from "react-native-responsive-screen";

type RouteNames = "index" 
            | "search/index" 
            | "courses/index"
            | "profile/index"
            | "wishlist/index";

            
const TabBar = ({state, navigation, descriptors}: any) => {

    const icons = {
        ['index']: ({color}: {color: string}) => <Octicons name="home" size={20} color={color} />,
        ['search/index']: ({color}: {color: string}) => <Ionicons name="search" size={20} color={color} />,
        ['courses/index']: ({color}: {color: string}) => <AntDesign name="book" size={20} color={color} />,
        ['profile/index']: ({color}: {color: string}) => <AntDesign name="user" size={20} color={color} />,
        ['wishlist/index']: ({color}: {color: string}) => <AntDesign name="staro" size={20} color={color} />,
    }
    const primaryColor = '#fff';
    const greyColor = 'rgba(0, 0, 0, 0.5)';

    return (
        <View style={[styles.tabBar]}>
          {state.routes.map((route: any, index: any) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;
    
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
    
            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.tabBarItem]}
              >
                {
                    icons[routeName as RouteNames]?.({
                        color: isFocused ? primaryColor : greyColor
                    })
                }
                <Text style={{ color: isFocused ? primaryColor : greyColor }}>
                  {label + ''}
                </Text>
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
        backgroundColor: '#0085ff',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderCurve: 'continuous',
        borderRadius: 20,
        marginBottom: 10,
        marginHorizontal: 'auto',
        width: wp(96),
        shadowColor: 'black',
        shadowOffset: {
            width: 0,
            height: 10
        },
        shadowRadius: 10,
        shadowOpacity: 0.1
    },
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default TabBar;