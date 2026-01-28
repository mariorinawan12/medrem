/**
 * Calendar Picker Component
 * 
 * Custom calendar grid that shows immediately when clicked
 * - No native date input, pure custom UI
 * - Shows month/year with navigation
 * - Grid of dates to select
 * - Works consistently on Web, iOS, and Android
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPicker({
  selectedDate,
  onDateSelect,
  minimumDate,
  maximumDate,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
    
    // Update the selected date with the new year
    const updatedDate = new Date(selectedDate);
    updatedDate.setFullYear(year);
    
    // Ensure the date is valid (e.g., Feb 29 on non-leap year)
    if (updatedDate.getMonth() !== selectedDate.getMonth()) {
      // If month changed (invalid date), set to last day of intended month
      updatedDate.setDate(0);
    }
    
    onDateSelect(updatedDate);
  };

  // Generate year range (current year + 10 to current year - 100), descending order
  const yearRange = useMemo(() => {
    const currentYearNow = new Date().getFullYear();
    const years = [];
    for (let i = currentYearNow + 10; i >= currentYearNow - 100; i--) {
      years.push(i);
    }
    return years;
  }, []);

  // Auto-scroll to selected month when modal opens
  useEffect(() => {
    if (showMonthPicker && monthScrollRef.current) {
      // Delay to ensure modal is rendered
      setTimeout(() => {
        const itemHeight = 48; // pickerItem height (12 padding top + 12 padding bottom + 16 text + 8 margin)
        const scrollPosition = currentMonth * itemHeight;
        monthScrollRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 100);
    }
  }, [showMonthPicker, currentMonth]);

  // Auto-scroll to selected year when modal opens
  useEffect(() => {
    if (showYearPicker && yearScrollRef.current) {
      // Delay to ensure modal is rendered
      setTimeout(() => {
        const itemHeight = 48;
        const yearIndex = yearRange.indexOf(currentYear);
        if (yearIndex !== -1) {
          const scrollPosition = yearIndex * itemHeight;
          yearScrollRef.current?.scrollTo({ y: scrollPosition, animated: false });
        }
      }, 100);
    }
  }, [showYearPicker, currentYear, yearRange]);

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    
    if (minimumDate && date < minimumDate) {
      return true;
    }
    
    if (maximumDate && date > maximumDate) {
      return true;
    }
    
    return false;
  };

  const isDateSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const handleDatePress = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            selected && styles.selectedDay,
            disabled && styles.disabledDay,
          ]}
          onPress={() => handleDatePress(day)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.dayText,
              selected && styles.selectedDayText,
              disabled && styles.disabledDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  return (
    <View style={styles.container}>
      {/* Month/Year Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.headerButton}>
            <Text style={styles.headerText}>{MONTHS[currentMonth]}</Text>
            <Ionicons name="chevron-down" size={16} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowYearPicker(true)} style={styles.headerButton}>
            <Text style={styles.headerText}>{currentYear}</Text>
            <Ionicons name="chevron-down" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.daysRow}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMonthPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            <ScrollView ref={monthScrollRef} style={styles.pickerScroll}>
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.pickerItem,
                    currentMonth === index && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      currentMonth === index && styles.pickerItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowYearPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            <ScrollView ref={yearScrollRef} style={styles.pickerScroll}>
              {yearRange.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    currentYear === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      currentYear === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0f9f0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '70%',
    maxWidth: 300,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: '#4CAF50',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
