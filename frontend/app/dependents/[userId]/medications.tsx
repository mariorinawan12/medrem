import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Text } from 'react-native';
import { getMedicationsForDependent } from '@/lib/medication-dependent';
import { generateDependentLoginCode } from '@/lib/dependent';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ManageMedicationsPage() {
  const { userId, fullName } = useLocalSearchParams();
  const router = useRouter();
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateLoginCode = async () => {
    setIsLoading(true);
    try {
      const response = await generateDependentLoginCode(userId.toString());
      setLoginCode(response.code);
      setExpiresAt(response.expiresAt);
    } catch (error) {
      console.error('Error generating login code:', error);
      setLoginCode(null);
      setExpiresAt(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <View style={styles.container}>
      <LinearGradient
        style={styles.headerGradient}
        colors={['#1a8e2d', '#146922']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(drawer)/(tabs-amain)/dependents')}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dependent Info</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <Text style={[styles.infoText, { color: '#666' }]}>User ID: {userId}</Text>
        <Text style={[styles.infoText, { color: '#666' }]}>Full name: {fullName}</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            router.push({
              pathname: '/dependents/[userId]/medication-management',
              params: { userId: userId.toString(), fullName: fullName.toString() },
            });
          }}
        >
          <Text style={[styles.cardTitle, { color: '#000', fontWeight: '600' }]}>Manage Medications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            router.push({
              pathname: '/dependents/[userId]/schedule',
              params: { userId: userId.toString(), fullName: fullName.toString() },
            });
          }}
        >
          <Text style={[styles.cardTitle, { color: '#000', fontWeight: '600' }]}>View Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            router.push({
              pathname: '/dependents/[userId]/medication-history',
              params: { userId: userId.toString(), fullName: fullName.toString()},
            });
          }}
        >
          <Text style={[styles.cardTitle, { color: '#000', fontWeight: '600' }]}>View Medication History</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={[styles.card, styles.codeCard]}
  onPress={handleGenerateLoginCode}
  disabled={isLoading}
>
  <Text style={[styles.cardTitle, { color: '#000', fontWeight: '600' }]}>
    {isLoading ? 'Generating Code...' : 'Generate Login Code'}
  </Text>
  {loginCode && (
    <View style={styles.codeContainer}>
      <Text style={styles.codeValue}>{loginCode}</Text>
      <Text style={styles.disclaimerText}>
        Share this code with the other user to allow them to sign in to the dependent account.
      </Text>
    </View>
  )}
</TouchableOpacity>

     
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  content: {
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 15,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  codeCard: {
    backgroundColor: '#E6E6FA',
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  codeContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  codeTitle: {
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e8b57',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    color: '#666',
  },
  disclaimerText: {
    marginTop: 0,
    fontSize: 14,
    textAlign: 'center',
    color: '#666', // or use your theme color for secondary text
  }
});