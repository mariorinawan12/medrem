import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { login } from '@/lib/auth';
import { getMedicationSchedule } from '@/lib/medication';
import { registerForNotifications, scheduleMedicationNotifications} from '@/lib/notification-helper';
import { setupFCM } from '@/lib/fcm-token-manager';



//const { width } = Dimensions.get('window');

export default function AuthScreen() {  
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();

    const handleLogin = async () => {
        setIsAuthenticating(true);
        setError(null); // Clear any previous errors
      
        try {
          const res = await login(email, password);
      
          if (res.token) {
            setEmail('');
            setPassword('');
            
            // Setup FCM for server-side notifications (web only for now)
            try {
              await setupFCM();
            } catch (fcmError) {
              console.log('[Login] FCM setup failed (non-critical):', fcmError);
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
            
            router.replace('/(drawer)/(tabs-amain)/home');
            
          } else {
            throw new Error('Login failed!');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsAuthenticating(false);
        }
      };

    return (
        <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="medical" size={80} color="white" />
                </View>
                <Text style={styles.title}>Medication Reminder</Text>
                <Text style={styles.subtitle}>Your personal medication assistant</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome Back!</Text>

                    {/* Email Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Password Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={{ alignSelf: 'flex-end', marginBottom: 15 }}
                        onPress={() => router.push('/auth/forgot-password')}
                    >
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 14 }}>
                        Forgot Password?
                    </Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        {isAuthenticating ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <TouchableOpacity style={styles.registerContainer} onPress={() => router.push('/auth/register')}>
                        <Text style={styles.registerText}>
                            Don't have an account? <Text style={styles.registerLink}>Register</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Sign in as Dependent Link */}
                    <TouchableOpacity style={styles.dependentContainer} onPress={() => router.push('/auth/dependent')}>
                        <Text style={styles.dependentText}>
                            Sign in as <Text style={styles.dependentLink}>Dependent</Text>
                        </Text>
                    </TouchableOpacity>
                    



                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="red" style={{ marginRight: 5 }} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
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
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerContainer: {
        marginTop: 15,
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerLink: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    dependentContainer: {
        marginTop: 10,
    },
    dependentText: {
        fontSize: 14,
        color: '#666',
    },
    dependentLink: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
    },
});
