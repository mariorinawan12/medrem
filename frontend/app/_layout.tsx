import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font'; // Wajib ada
import InAppNotification from '@/components/InAppNotification';


SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const { width } = useWindowDimensions();
  
  
  const [loaded, error] = useFonts({
    'Ionicons': require('../assets/fonts/Ionicons.ttf'),
    'FontAwesome': require('../assets/fonts/FontAwesome.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  const shouldBeMobileView = Platform.OS === 'web';

  
  if (!loaded && !error) {
    return null;
  }

  return (
    <View style={styles.outerContainer}>
      {Platform.OS === 'web' && (
        <View style={styles.notifAnchor}>
          <InAppNotification />
        </View>
      )}

      <View style={[
        styles.innerContainer,
        shouldBeMobileView && { 
          maxWidth: 450, 
          alignSelf: 'center',
          width: width > 450 ? 450 : '100%' 
        }
      ]}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000', 
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden', 
    position: 'relative',
   
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      }
    })
  },
  notifAnchor: {
    position: 'absolute',
    top: 0,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});