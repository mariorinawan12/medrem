import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions, Platform} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loginWithCode } from '@/lib/dependent';
import { getMedicationSchedule } from '@/lib/medication';
import { registerForNotifications, scheduleMedicationNotifications} from '@/lib/notification-helper';
import { setupFCM } from '@/lib/fcm-token-manager';

export default function DependentLoginScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDependentLogin = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // TODO: add your dependent login logic here
      console.log('Logging in with code:', code);

      const res = await loginWithCode(code);
      // After successful login, navigate to home
      if (res.token) {
        setCode(''); // Clear the code input

        // Setup FCM for server-side notifications (web only for now)
        try {
          await setupFCM();
        } catch (fcmError) {
          console.log('[Dependent Login] FCM setup failed (non-critical):', fcmError);
          // Continue even if FCM setup fails
        }

        // Setup local notifications for all platforms (including iOS PWA)
        try {
          await registerForNotifications();
          const schedule = await getMedicationSchedule();
          if (schedule && schedule.length > 0) {
            await scheduleMedicationNotifications(schedule);
          }
        } catch (notificationError) {
          console.error('Failed to register for notifications:', notificationError);
          // Continue even if notification setup fails
        }
        
        console.log('Login successful, token:', res.token);
        router.replace('/(drawer)/(tabs-dependent)/home'); // Go to Home (tabs)
      } else {
        throw new Error('Login failed!'); // Customize this error based on your API response
      }
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name='key' size={80} color='white' />
        </View>

        <Text style={styles.title}>Sign In as Dependent</Text>
        <Text style={styles.subtitle}>Enter the code provided by your parent</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Enter Code"
            placeholderTextColor="#999"
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleDependentLogin} disabled={isAuthenticating}>
            <Text style={styles.buttonText}>
              {isAuthenticating ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="red" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.loginContainer} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginText}>
              Have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: "100%",
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width:0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginLeft: 8,
    fontSize: 14,
  },
  loginContainer: {
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#555',
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
