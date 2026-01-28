import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getActiveDates, getMedicationsForDate, setMedicationAsTaken } from '@/lib/medication';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medications, setMedications] = useState<any[]>([]);
  const [currentMedications, setCurrentMedications] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const meds = await getActiveDates();
      setMedications(meds);
      fetchMedicationsForDate(selectedDate);
    } catch (error) {
      console.error('Failed to fetch medications:', error);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(selectedDate);

  const getCalendarDateString = (date: Date) => {
    // Force the date to use local timezone without conversion
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0  // Set to noon to avoid midnight timezone issues
    );
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const isActiveDate = (date: Date) => {
    const dateStr = getCalendarDateString(date);
    return medications.some((med) => med.date === dateStr);
  };

  const fetchMedicationsForDate = async (date: Date) => {
    const dateStr = getCalendarDateString(date);
    try {
      const medsForDate = await getMedicationsForDate(dateStr);
      setCurrentMedications(medsForDate);
    } catch (error) {
      console.error('Failed to fetch medications for the date:', error);
    }
  };

  const renderCalendar = () => {
    const calendar: JSX.Element[] = [];
    let week: JSX.Element[] = [];
  
    for (let i = 0; i < firstDay; i++) {
      week.push(<View key={`empty-start-${i}`} style={styles.calendarDay} />);
    }
  
    for (let day = 1; day <= days; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelectedDate = selectedDate.toDateString() === date.toDateString();
  
      week.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelectedDate && { backgroundColor: '#1a8e2d15' }, // Only selected gets green bg
            isToday && !isSelectedDate && { backgroundColor: 'transparent' } // Today gets no special bg
          ]}
          onPress={() => {
            setSelectedDate(date);
            fetchMedicationsForDate(date);
          }}
        >
          <Text
            style={[
              styles.dayText,
              isSelectedDate && { color: '#1a8e2d', fontWeight: '600' }, // Only selected gets green text
              isToday && !isSelectedDate && styles.dayText // Today gets normal text
            ]}
          >
            {day}
          </Text>
          {isActiveDate(date) && <View style={styles.eventDot} />}
        </TouchableOpacity>
      );
  
      if ((firstDay + day) % 7 === 0 || day === days) {
        while (week.length < 7) {
          week.push(<View key={`empty-end-${week.length}`} style={styles.calendarDay} />);
        }
        calendar.push(<View key={`week-${day}`} style={styles.calendarWeek}>{week}</View>);
        week = [];
      }
    }
  
    return calendar;
  };
  
  

  const renderMedicationForDate = () => {
    if (currentMedications.length === 0) {
      return <Text style={{ marginTop: 20, color: '#999' }}>No medication scheduled for this day.</Text>;
    }
  
    return currentMedications.map((medication) => {
      const status = medication.medicationStatus;
      const reminderTime = new Date(medication.reminderTime);
      const currentTime = new Date();
      
      const isClickable = status === 'not-taken' && currentTime >= reminderTime;
  
      const handlePress = isClickable
        ? async () => {
            try {
              await setMedicationAsTaken(medication.medicationTimeId);
              loadData();
            } catch (error) {
              console.error('Failed to mark as taken:', error);
            }
          }
        : undefined;
  
      return (
        <View style={styles.medicationCard} key={medication.id}>
          <View style={[styles.medicationColor, { backgroundColor: medication.color || '#1a8e2d' }]} />
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationDosage}>Dosage: {medication.dosage}</Text>
            <Text style={styles.medicationTime}>
              Time: {reminderTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
          </View>
  
          {status === 'taken' ? (
            <View style={styles.takenBadge}>
              <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
              <Text style={styles.takenText}>Taken</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.takeDoseButton, 
                { 
                  backgroundColor: status === 'late' ? '#e74c3c' : '#1a8e2d',
                  opacity: isClickable ? 1 : 0.6
                }
              ]}
              onPress={handlePress}
              disabled={!isClickable}
            >
              <Text style={styles.takeDoseText}>
                {status === 'late' ? 'Late' : 'Take'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    });
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
          {/* <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
      </View>
      <View style={styles.calenderContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day) => (
            <Text style={styles.weekdayText} key={day}>{day}</Text>
          ))}
        </View>
        {renderCalendar()}
      </View>
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>
          {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <ScrollView>{renderMedicationForDate()}</ScrollView>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height : 60,
    // height: Platform.OS === 'ios' ? 140 : 120,
  },
  content: { paddingTop: 15},
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
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  calenderContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthText: { fontSize: 18, fontWeight: '600', color: '#333' },
  weekdayHeader: { flexDirection: 'row', marginBottom: 10 },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  calendarWeek: { flexDirection: 'row', marginBottom: 5 },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: { fontSize: 16, color: '#333' },
  today: { backgroundColor: '#1a8e2d15' },
  todayText: { color: '#1a8e2d', fontWeight: '600' },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a8e2d',
    position: 'absolute',
    bottom: '15%',
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 15 },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicationColor: {
    width: 12,
    height: 40,
    borderRadius: 6,
    marginRight: 15,
  },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicationDosage: { fontSize: 14, color: '#666' },
  medicationTime: { fontSize: 14, color: '#666' },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  takeDoseText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  takenText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
});
