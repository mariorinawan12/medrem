import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your resetPassword function here
import { resetPassword } from '@/lib/auth';// adjust path accordingly

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleResetPassword = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newPassword.trim()) throw new Error('Password cannot be empty');

      // Call your centralized resetPassword function here
      const res = await resetPassword(newPassword);

      if (res.message !== 'Password has been reset successfully') {
        throw new Error(res.message || 'Failed to reset password');
      }
      setNewPassword(''); // Clear password input

      setSuccess('Password has been reset successfully!');
      await AsyncStorage.removeItem('resetToken');

      setTimeout(() => {
        router.replace('/auth/login');
      }, 150000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color="white" />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {error && (
            <View style={styles.messageContainer}>
              <Ionicons name="alert-circle" size={20} color="red" style={{ marginRight: 5 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.messageContainer}>
              <Ionicons name="checkmark-circle" size={20} color="green" style={{ marginRight: 5 }} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>Back</Text>
        </TouchableOpacity>
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
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: width - 40,
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
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
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
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  successText: {
    color: 'green',
    fontSize: 14,
  },
});
