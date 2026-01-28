import { Drawer } from 'expo-router/drawer';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter, useSegments, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAllMedicationNotifications } from '@/lib/notification-helper';
import { clearStoredToken, setupFCM } from '@/lib/fcm-token-manager';
import { unregisterFcmToken, getToken } from '@/lib/auth';

export default function DrawerLayout() {
  const router = useRouter();
  const segments = useSegments() as any;
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storedName, storedRole] = await Promise.all([
          AsyncStorage.getItem('name'),
          AsyncStorage.getItem('role')
        ]);
        setName(storedName);
        setRole(storedRole);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Setup FCM on app load (handles browser refresh)
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Check if user is logged in
        const token = await getToken();
        if (!token) {
          console.log('[Drawer] User not logged in, skipping FCM setup');
          return;
        }

        // Setup FCM (will skip if already registered)
        console.log('[Drawer] Initializing FCM...');
        await setupFCM();
        console.log('[Drawer] FCM setup complete');
      } catch (error) {
        console.error('[Drawer] FCM setup failed:', error);
      }
    };

    initializeFCM();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#1a8e2d" />
      </View>
    );
  }

  // --- LOGIKA SMART GUARD (AGAR TIDAK SELALU KE HOME) ---
  const isInsideAmain = segments.includes('(tabs-amain)');
  const isInsideDependent = segments.includes('(tabs-dependent)');

  // Ambil rute terakhir (misal: 'medication-management')
  // Filter segmen yang bukan nama grup atau folder drawer
  const targetRoute = segments.filter((s: string) =>
    !s.startsWith('(') && s !== 'drawer'
  ).join('/');

  if (role === 'dependent_user' && isInsideAmain) {
    // Kalau dia punya target menu (bukan home), arahkan ke menu itu di folder dependent
    const finalPath = targetRoute && targetRoute !== 'home'
      ? `/(drawer)/(tabs-dependent)/${targetRoute}`
      : `/(drawer)/(tabs-dependent)/home`;

    return <Redirect href={finalPath as any} />;
  }

  if (role !== 'dependent_user' && isInsideDependent) {
    const finalPath = targetRoute && targetRoute !== 'home'
      ? `/(drawer)/(tabs-amain)/${targetRoute}`
      : `/(drawer)/(tabs-amain)/home`;

    return <Redirect href={finalPath as any} />;
  }

  const handleLogout = async () => {
    try {
      // Get stored FCM token before clearing, so we can unregister this specific device
      const { getStoredToken } = await import('@/lib/fcm-token-manager');
      const storedFcmToken = await getStoredToken();

      try { await unregisterFcmToken(storedFcmToken); } catch (e) { }
      await clearStoredToken();
      await AsyncStorage.multiRemove(['token', 'name', 'role', 'resetToken']);
      if (Platform.OS !== 'web') {
        await clearAllMedicationNotifications();
      }
      router.replace('/auth/login');
    } catch (error) {
      router.replace('/auth/login');
    }
  };

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: '#f8f9fa' },
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
      drawerContent={(props) => (
        <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'bottom']}>
          <View style={styles.drawerContainer}>
            <View style={styles.profileContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#6c757d" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.userName} numberOfLines={1}>{name || 'Guest'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/main_profile')}>
                <Ionicons name="person-outline" size={20} color="#495057" />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/setting/setting')}>
                <Ionicons name="settings-outline" size={20} color="#495057" />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>


              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/medication-management/medication-history')}>
                <Ionicons name="time-outline" size={20} color="#495057" />
                <Text style={styles.menuText}>Medication History</Text>
              </TouchableOpacity>

            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={20} color="#dc3545" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>
        </SafeAreaView>
      )}
    >
      <Drawer.Screen
        name={"(tabs-amain)" as any}
        options={{
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name={"(tabs-dependent)" as any}
        options={{
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  drawerContainer: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  profileContainer: { padding: 25, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userInfo: { flex: 1 },
  welcomeText: { fontSize: 14, color: '#6c757d' },
  userName: { fontSize: 18, fontWeight: '600', color: '#212529' },
  divider: { height: 1, backgroundColor: '#dee2e6', marginHorizontal: 20, marginVertical: 10 },
  menuContainer: { flex: 1, paddingTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25 },
  menuText: { fontSize: 16, color: '#212529', marginLeft: 15 },
  bottomSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#dee2e6' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  logoutText: { fontSize: 16, color: '#dc3545', marginLeft: 15, fontWeight: '500' },
  versionText: { fontSize: 12, color: '#6c757d', textAlign: 'center', marginTop: 10 },
});