import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getMedicationList, deleteMedicationForSelf } from '@/lib/medication';
import { scheduleMedicationNotifications, clearAllMedicationNotifications } from '@/lib/notification-helper';
import { getMedicationSchedule } from '@/lib/medication';

export default function MedicationScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<any[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const data = await getMedicationList();
        setMedications(data);
        setFilteredMedications(data);
      } catch (error) {
        // console.error('Failed to fetch medications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMedications(medications);
    } else {
      const filtered = medications.filter(med =>
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) 
      );
      setFilteredMedications(filtered);
    }
  }, [searchQuery, medications]);

  const handleDelete = async (medicationId: string) => {
    try {
      await deleteMedicationForSelf(medicationId);
      // Update local meds state
      const updatedMeds = medications.filter((m) => m.medicationId !== medicationId);
      setMedications(updatedMeds);
  
      // Clear all notifications
      await clearAllMedicationNotifications();
  
      if (updatedMeds.length > 0) {
        // If still meds left, reschedule notifications
        const schedule = await getMedicationSchedule();
        if (schedule && schedule.length > 0) {
          await scheduleMedicationNotifications(schedule);
        } else {
          console.log('No medication schedule found to reschedule notifications.');
        }
      } else {
        console.log('No medications left, notifications cleared.');
      }
    } catch (error) {
      console.error('Failed to delete medication:', error);
    }
  };

  const renderMedication = ({ item }: any) => {
    const isMenuVisible = menuVisibleId === item.medicationId;

    return (
      <View key={item.medicationId} style={styles.medicationCardWrapper}>
        {isMenuVisible && (
          <Pressable 
            style={styles.menuOverlay}
            onPress={() => setMenuVisibleId(null)}
          />
        )}
        
        <View style={styles.medicationCard}>
          <View style={styles.cardHeader}>
            <Text style={{ color: '#000', fontWeight: '600', fontSize: 16 }}>{item.name}</Text>

            <TouchableOpacity
              onPress={() =>
                setMenuVisibleId(isMenuVisible ? null : item.medicationId)
              }
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#333', fontSize: 14, marginBottom: 4 }}>Dosage: {item.dosage}</Text>
          <Text style={{ color: '#333', fontSize: 14 }}>Stock: {item.stockQuantity}</Text>
        </View>

        {isMenuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity
              onPress={() => {
                setMenuVisibleId(null);
                router.push(`/medication-management/edit-medication/${item.medicationId}`);
              }}
            >
              <Text style={styles.menuItem}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuVisibleId(null);
                handleDelete(item.medicationId);
              }}
            >
              <Text style={styles.menuItem}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: 'white', fontWeight: '700' }]}>Medications</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInnerContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medications..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearIcon}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.innerContainer}>
          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" style={styles.loading} />
            ) : filteredMedications.length === 0 ? (
              <View style={styles.noMedicationsContainer}>
                <Text style={styles.noMedicationsText}>
                  {searchQuery.trim() === '' 
                    ? 'No medications found.' 
                    : 'No medications match your search.'}
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.list} 
                contentContainerStyle={styles.scrollContent}
              >
                {filteredMedications.map((item) => renderMedication({ item }))}
              </ScrollView>
            )}
          </View>

          <View style={styles.buttonOuterContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/medication-management/add-medication')}
            >
              <Text style={[styles.buttonText, { color: 'white', fontWeight: 'bold' }]}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  searchInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
    paddingVertical: 0,
  },
  searchIcon: {
    marginRight: 5,
  },
  clearIcon: {
    marginLeft: 10,
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 1,
  },
  headerTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  list: {
    flex: 1,
  },
  medicationCardWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  medicationCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 24,
    paddingHorizontal: 10,
    color: '#000',
  },
  menu: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  buttonOuterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 30,
  },
  noMedicationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noMedicationsText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});