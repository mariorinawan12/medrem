import React, { useState, useMemo } from 'react';
import { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ListRenderItem,
  Platform,
  Pressable,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DatePickerModal from '@/components/DatePickerModal';

import { getMedicationHistoryForDependent } from '@/lib/medication-dependent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

type MedicationHistoryItem = {
  id: string;
  name: string;
  date: string; // ISO string
  time: string; // HH:mm format
  status: 'taken' | 'late';
};

const statusColors: Record<MedicationHistoryItem['status'], string> = {
  taken: '#C8E6C9', // Light green
  late: '#FFCDD2',  // Light red
};

const statusDisplayText: Record<MedicationHistoryItem['status'], string> = {
  taken: 'ON TIME',
  late: 'LATE'
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MedicationHistoryScreen: React.FC = () => {
  const router = useRouter();
  
  // Set default date range to last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const [startDate, setStartDate] = useState<Date>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [history, setHistory] = useState<MedicationHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
    const { userId, fullName, refresh } = useLocalSearchParams<{ 
      userId: string; 
      fullName: string; 
      refresh?: string 
    }>();



  useEffect(() => {
    const fetchUserRole = async () => {
      // Simulate fetching user role, replace with actual logic
      const role = await AsyncStorage.getItem('role');
      setUserRole(role);
    };

    fetchUserRole();
  });

  const handleStartDateConfirm = (selectedDate: Date) => {
    setStartDate(selectedDate);
    setShowStartPicker(false);
  };

  const handleEndDateConfirm = (selectedDate: Date) => {
    setEndDate(selectedDate);
    setShowEndPicker(false);
  };

  // Fetch data whenever date range changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMedicationHistoryForDependent(userId,startDate, endDate);
        setHistory(data);
      } catch (error) {
        //console.error('Failed to fetch medication history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [history, startDate, endDate]);

  const renderItem: ListRenderItem<MedicationHistoryItem> = ({ item }) => (
    <View style={[styles.card, { backgroundColor: statusColors[item.status] }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.medicationName, { color: '#000', fontWeight: '600' }]}>
          {item.name}
        </Text>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={[styles.timeText, { color: '#666' }]}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.dateText, { color: '#666' }]}>
          {formatDate(item.date)}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'taken' ? '#2E7D32' : '#C62828' }
        ]}>
          <Text style={[styles.statusText, { color: 'white', fontWeight: '600' }]}>
            {statusDisplayText[item.status]}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Pressable onPress={() =>  router.replace({
      pathname: '/dependents/[userId]/medications',
      params: { userId: userId, fullName: fullName }, 
    })} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={[styles.title, { color: '#000', fontWeight: 'bold' }]}>
          Medication History
        </Text>
        </View>
       

        {/* Date Range Picker */}
        <View style={styles.datePickerContainer}>
          <Pressable 
            onPress={() => setShowStartPicker(true)} 
            style={styles.datePicker}
          >
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={[styles.datePickerText, { color: '#444' }]}>
              {startDate.toLocaleDateString()}
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setShowEndPicker(true)} 
            style={styles.datePicker}
          >
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={[styles.datePickerText, { color: '#444' }]}>
              {endDate.toLocaleDateString()}
            </Text>
          </Pressable>
        </View>

        <DatePickerModal
          visible={showStartPicker}
          value={startDate}
          onConfirm={handleStartDateConfirm}
          onCancel={() => setShowStartPicker(false)}
          maximumDate={endDate}
          title="Select Start Date"
        />

        <DatePickerModal
          visible={showEndPicker}
          value={endDate}
          onConfirm={handleEndDateConfirm}
          onCancel={() => setShowEndPicker(false)}
          minimumDate={startDate}
          maximumDate={today}
          title="Select End Date"
        />

        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => `${item.id}-${item.date}-${item.time}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
              No medications found for the selected date range.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 20,
  paddingTop: 10,
  minHeight: '100%',
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    flexShrink: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  datePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 8,
    borderRadius: 8,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12
  },
});

export default MedicationHistoryScreen;