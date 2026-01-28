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
import { verifyResetCode } from '@/lib/auth';

const { width } = Dimensions.get('window');

export default function VerifyCodeScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Replace with actual verification logic
      if (code.trim() === '') throw new Error('Code cannot be empty');

      // Example: simulate success
        const res = await verifyResetCode(code);
        if (!res || !res.message?.includes('Reset code verified')) {
            throw new Error(res.message || 'Failed to verify code');
            }
        setSuccess('Code verified! Proceed to reset password.');

      // Navigate to reset password screen
      router.push('/auth/reset-password');
    } catch (err: any) {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="key" size={80} color="white" />
        </View>
        <Text style={styles.title}>Enter Reset Code</Text>
        <Text style={styles.subtitle}>Check your email for the verification code</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Enter Code"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
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
