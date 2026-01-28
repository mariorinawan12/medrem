import React, { useEffect, useState } from 'react';
import { useNotificationListener, cancelScheduledNotification } from '@/lib/notification-helper';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Platform,
  Text
} from 'react-native';
import { useRouter, useNavigation, Stack } from 'expo-router';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Ionicons } from '@expo/vector-icons';

import { getMedicationSchedule, setMedicationAsTaken } from '@/lib/medication';
import type { Medication } from '@/types/medication';
import * as Notifications from 'expo-notifications';
import { DrawerActions } from '@react-navigation/native';

//const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { getItem } = useAsyncStorage('token');
  const [token, setToken] = useState<string | null>(null);
  const [medicationsToday, setMedicationsToday] = useState<Medication[]>([]);
  const [allSchedules, setAllSchedules] = useState<Medication[]>([]);
  const [takenCount, setTakenCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useNotificationListener();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedToken = await getItem();
        setToken(storedToken);

        setMedicationsToday([]);
        setAllSchedules([]);
        setTakenCount(0);

        if (storedToken) {
          await fetchMedications();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const fetchMedications = async () => {
    try {
      const schedule = await getMedicationSchedule();

      if (!schedule || schedule.length === 0) {
        setMedicationsToday([]);
        setAllSchedules([]);
        setTakenCount(0);
        return;
      }

      const today = new Date();
      const filteredSchedule = schedule.filter((medication: Medication) => {
        const medicationDate = new Date(medication.reminderTime);
        return medicationDate.toDateString() === today.toDateString();
      });

      filteredSchedule.sort((a: Medication, b: Medication): number => {
        if (a.medicationStatus === 'taken' && b.medicationStatus !== 'taken') return -1;
        if (a.medicationStatus !== 'taken' && b.medicationStatus === 'taken') return 1;
        return new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime();
      });

      const taken: number = filteredSchedule.filter((m: Medication) =>
        m.medicationStatus === 'taken' || m.medicationStatus === 'late'
      ).length;

      setMedicationsToday(filteredSchedule);
      setTakenCount(taken);
      setAllSchedules(schedule);
    } catch (err: any) {
      if (err.message === 'No medication times found.') {
        setMedicationsToday([]);
        setAllSchedules([]);
        setTakenCount(0);
      } else {
        console.error('Error loading medications:', err.message);
      }
    }
  };

  const handleMarkAsTaken = async (medicationTimeId: string) => {
    try {
      const response = await setMedicationAsTaken(medicationTimeId);
      const followUpNotificationIds = response.followUpNotificationId;
      console.log("followUpNotificationIds:", followUpNotificationIds);

      // Cancel notifications (works for both mobile and web)
      if (Array.isArray(followUpNotificationIds)) {
        for (const id of followUpNotificationIds) {
          console.log("Cancelling follow-up notification ID:", id);
          await cancelScheduledNotification(id);
        }
      } else if (typeof followUpNotificationIds === "string") {
        // fallback in case it's a single string
        await cancelScheduledNotification(followUpNotificationIds);
      }

      fetchMedications();
    } catch (error) {
      console.error('Failed to mark as taken:', error);
    }
  };

  const getNextMedication = () => {
    const upcoming = medicationsToday.filter(m =>
      new Date(m.reminderTime) > currentTime &&
      m.medicationStatus === 'not-taken'
    ).sort((a, b) =>
      new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime()
    );
    return upcoming[0];
  };

  const nextMed = getNextMedication();

  const renderMedication = ({ item }: { item: Medication }) => {
    const isFuture = new Date(item.reminderTime) > currentTime;
    const isDisabled = item.medicationStatus !== 'not-taken' || isFuture;
    const reminderTime = new Date(item.reminderTime);
    const isLate =
      (new Date(item.reminderTime).getTime() + (5 * 60 * 1000)) < currentTime.getTime() &&
      item.medicationStatus === 'not-taken';
    return (

      <View style={[
        styles.medicationCard,
        item.medicationStatus === 'taken' && styles.takenCard,
        (item.medicationStatus === 'late' || isLate) && styles.lateCard
      ]}>
        <View style={styles.medicationHeader}>
          <Text style={[styles.medicationName, { color: '#000', fontWeight: '600' }]}>
            {item.name}
          </Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={[styles.timeText, { color: '#666' }]}>
              {new Date(item.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            item.medicationStatus === 'taken' && styles.takenBadge,
            (item.medicationStatus === 'late' || isLate) && styles.lateBadge,
            item.medicationStatus === 'not-taken' && styles.pendingBadge
          ]}>
            <Text style={[styles.statusText, { 
              color: item.medicationStatus === 'taken' ? '#2E7D32' :
                     (item.medicationStatus === 'late' || isLate) ? '#C62828' :
                     '#F57F17'
            }]}>
              {item.medicationStatus === 'taken' ? 'On Time' :
                item.medicationStatus === 'late' || isLate ? 'Late' :
                  isFuture ? 'Upcoming' : 'Pending'}
            </Text>
          </View>

          {item.medicationStatus === 'not-taken' && (
            <TouchableOpacity
              style={[
                styles.takeButton,
                isDisabled && styles.disabledButton
              ]}
              onPress={() => handleMarkAsTaken(item.medicationTimeId)}
              disabled={isDisabled}
            >
              <Text style={[styles.takeButtonText, { color: 'white', fontWeight: '600' }]}>
                {isFuture ? 'Upcoming' : isLate ? 'Mark as Taken' : 'Mark Taken'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const totalToday = medicationsToday.length;
  const progress = totalToday === 0 ? 0 : (takenCount / totalToday) * 100;
  const greeting = getGreeting();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      height: 60, 
      backgroundColor: 'white'}}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
    
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: '#000', fontWeight: 'bold' }]}>{greeting}</Text>
          <Text style={[styles.dateText, { color: '#666' }]}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="medkit-outline" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statTitle, { color: '#1976D2' }]}>Remaining</Text>
            <Text style={[styles.statValue, { color: '#1565C0', fontWeight: '600' }]}>{totalToday - takenCount}</Text>
          </View>


          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#388E3C" />
            </View>
            <Text style={[styles.statTitle, { color: '#388E3C' }]}>Taken</Text>
            <Text style={[styles.statValue, { color: '#2E7D32', fontWeight: '600' }]}>{takenCount}</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={[styles.sectionTitle, { color: '#000', fontWeight: '600' }]}>
            Today's Progress ({takenCount}/{totalToday})
          </Text>

          <View style={styles.progressContainer}>
            <AnimatedCircularProgress
              size={150}
              width={12}
              fill={progress}
              tintColor={progress === 100 ? '#4CAF50' : '#2196F3'}
              backgroundColor="#E0E0E0"
              rotation={0}
              lineCap="round"
            >
              {() => (
                <View style={styles.progressContent}>
                  <Text style={[styles.progressText, { color: '#2196F3', fontWeight: 'bold' }]}>{Math.round(progress)}%</Text>
                  <Text style={[styles.progressSubtext, { color: '#666' }]}>
                    {progress === 100 ? 'All done!' : 'Keep going!'}
                  </Text>
                </View>
              )}
            </AnimatedCircularProgress>

            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                <Text style={[styles.legendText, { color: '#666' }]}>Taken</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#E0E0E0' }]} />
                <Text style={[styles.legendText, { color: '#666' }]}>Remaining</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Medication */}
        {nextMed && (
          <View style={styles.nextMedSection}>
            <Text style={[styles.sectionTitle, { color: '#000', fontWeight: '600' }]}>Next Medication</Text>
            <TouchableOpacity
              style={styles.nextMedContainer}
            >
              <View style={styles.nextMedCard}>
                <View style={styles.nextMedIcon}>
                  <Ionicons name="alarm-outline" size={24} color="#1A8E2D" />
                </View>
                <View style={styles.nextMedInfo}>
                  <Text style={[styles.nextMedName, { color: '#1A8E2D', fontWeight: '600' }]}>
                    {nextMed.name}
                  </Text>
                  <Text style={[styles.nextMedTime, { color: '#4CAF50' }]}>
                    <Ionicons name="time-outline" size={14} />{' '}
                    {new Date(nextMed.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Schedule */}
        <Text style={[styles.sectionTitle, { color: '#000', fontWeight: '600' }]}>
          Today's Schedule ({medicationsToday.length})
        </Text>
        {medicationsToday.length === 0 ? (
          <View style={styles.noMedicationsContainer}>
            <Ionicons name="medical-outline" size={40} color="#888" />
            <Text style={[styles.noMedicationsText, { color: '#888' }]}>No medications scheduled for today</Text>
          </View>
        ) : (
          <FlatList
            data={medicationsToday}
            keyExtractor={(item) => item.medicationTimeId.toString()}
            renderItem={renderMedication}
            scrollEnabled={false}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    color: '#000',
    fontSize: 28,
    marginBottom: 4,
  },
  dateText: {
    color: '#666',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statTitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    color: '#000',
  },
  progressSection: {
    marginVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  progressContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 28,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  progressSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    marginVertical: 12,
    marginBottom: 8,
  },
  nextMedSection: {
    marginBottom: 16,
  },
  nextMedContainer: {
    marginTop: 8,
  },
  nextMedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  nextMedIcon: {
    marginRight: 12,
  },
  nextMedInfo: {
    flex: 1,
  },
  nextMedName: {
    fontSize: 18,
    color: '#1A8E2D',
    marginBottom: 4,
  },
  nextMedTime: {
    fontSize: 14,
    color: '#4CAF50',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  medicationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginVertical: 6,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    flexShrink: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  takenBadge: {
    backgroundColor: '#C8E6C9',
  },
  lateBadge: {
    backgroundColor: '#FFCDD2',
  },
  pendingBadge: {
    backgroundColor: '#FFF9C4',
  },
  statusText: {
    fontSize: 12,
  },
  takeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  takeButtonText: {
    color: 'white',
    fontSize: 14,
  },
  takenCard: {
    backgroundColor: '#E8F5E9',
  },
  lateCard: {
    backgroundColor: '#FFEBEE',
  },
  noMedicationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  noMedicationsText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuButton: {
    padding: 4,
  },
});