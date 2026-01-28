import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  Text,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
//import { ThemedView } from '@/components/ThemedView';
import {
  getMedicationForDependentWithSchedule,
  updateMedicationForDependent
} from '@/lib/medication-dependent';



const daysOfWeekOptions = [
  { label: 'Everyday', value: 'everyday' },
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

const medicationTypeOptions = [
  { label: 'Medication', value: 'medication' },
  { label: 'Vitamin', value: 'vitamin' },
];

const medicationFormOptions = [
  { label: 'Pills', value: 'pills' },
  { label: 'mg', value: 'mg' },
  { label: 'ml', value: 'ml' },
  { label: 'Drops', value: 'drops' },
  { label: 'Inhaler', value: 'inhaler' },
];


export default function EditMedicationScreen() {
  const router = useRouter();
  //const { medicationId, userId, fullName} = useLocalSearchParams();
  const { userId, fullName, refresh, medicationId } = useLocalSearchParams<{ 
      userId: string; 
      fullName: string; 
      refresh?: string;
      medicationId: string;
    }>();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [medicationType, setMedicationType] = useState('medication');
  const [medicationForm, setMedicationForm] = useState('pills');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['everyday']);

   // Custom Time Picker State
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [selectedHour, setSelectedHour] = useState(0);
   const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    const fetchMedication = async () => {
      try {
        const data = await getMedicationForDependentWithSchedule(userId, medicationId);
        setName(data.name);
        setDosage(data.dosage.toString());
        setStockQuantity(data.stockQuantity.toString());
        setMedicationType(data.medicationType || 'medication');
        setMedicationForm(data.medicationForm || 'pills');
        setReminderTimes(data.reminderTimes || []);
        setDaysOfWeek(data.dayTimes || ['everyday']);
      } catch (err) {
        console.error('Failed to fetch medication data:', err);
      }
    };

    fetchMedication();
  }, [medicationId]);

  const handleOpenTimePicker = () => {
    setSelectedHour(12);
    setSelectedMinute(0);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}:00`;
    setReminderTimes(prev => [...prev, timeString]);
    setShowTimePicker(false);
  };

  const handleDeleteTime = (timeToDelete: string) => {
    setReminderTimes(prevTimes => prevTimes.filter(time => time !== timeToDelete));
  };

  const toggleDayOfWeek = (dayTimes: string) => {
    if (dayTimes === 'everyday') {
      setDaysOfWeek(['everyday']);
    } else {
      setDaysOfWeek((prevDays) => {
        // Remove 'everyday' if any specific day is selected
        const filteredDays = prevDays.filter(d => d !== 'everyday');
        
        // Toggle the selected day
        if (filteredDays.includes(dayTimes)) {
          return filteredDays.filter(d => d !== dayTimes);
        } else {
          return [...filteredDays, dayTimes];
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!name || !dosage || !stockQuantity) {
      alert('Please fill in all fields');
      return;
    }
    if (reminderTimes.length === 0) {
      alert('Please add at least one reminder time');
      return;
    }
    try {
      const updatedMedication = {
        userId,
        medicationId,
        name,
        dosage: parseInt(dosage, 10),
        stockQuantity: parseInt(stockQuantity, 10),
        medicationType,
        medicationForm,
        daysOfWeek: daysOfWeek.includes('everyday') ? ['everyday'] : daysOfWeek,
        reminderTimes,
      };

      console.log('Updated medication data:', updatedMedication);
      await updateMedicationForDependent(updatedMedication);
      //alert('Medication updated successfully');
      router.push({
        pathname: '/dependents/[userId]/medication-management',
        params: { userId: userId.toString(), fullName: fullName.toString() },
       });
    } catch (error) {
      console.error('Failed to update medication:', error);
      //alert('Failed to update medication');
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        {/* Gradient Header */}
        <LinearGradient
          style={styles.headerGradient}
          colors={['#1a8e2d', '#146922']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        
        <View style={styles.content}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace({
              pathname: '/dependents/[userId]/medication-management',
              params: {refresh: 'true', userId: userId.toString(), fullName: fullName.toString()
              }
            })}>
              <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Edit Medication
            </ThemedText>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            <ThemedText style={styles.sectionTitle}>Medication Name</ThemedText>
            <TextInput
              placeholder="Medication Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Medication Type</ThemedText>
              <View style={styles.optionsContainer}>
                {medicationTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      medicationType === option.value && styles.selectedOption,
                    ]}
                    onPress={() => setMedicationType(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        medicationType === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Medication Form</ThemedText>
              <View style={styles.optionsContainer}>
                {medicationFormOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      medicationForm === option.value && styles.selectedOption,
                    ]}
                    onPress={() => setMedicationForm(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        medicationForm === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <ThemedText style={styles.sectionTitle}>Dosage</ThemedText>
            <TextInput
              placeholder="Dosage (e.g., 1)"
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
              style={styles.input}
            />
            
            <ThemedText style={styles.sectionTitle}>Stock Quantity</ThemedText>
            <TextInput
              placeholder="Stock Quantity"
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              style={styles.input}
            />

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Days to Remind</ThemedText>
              <View style={styles.daysContainer}>
                {daysOfWeekOptions.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      daysOfWeek.includes(day.value) && styles.selectedDay,
                    ]}
                    onPress={() => toggleDayOfWeek(day.value)}
                  >
                    <ThemedText
                      style={[
                        styles.dayButtonText,
                        daysOfWeek.includes(day.value) && styles.selectedDayText,
                      ]}
                    >
                      {day.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Reminder Times ({reminderTimes.length})
              </ThemedText>
              {reminderTimes.map((time, index) => (
                <View key={index} style={styles.timeContainer}>
                  <ThemedText style={styles.timeText}>
                    {index + 1}. {time}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleDeleteTime(time)}>
                    <ThemedText style={styles.deleteText}>❌</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

             <TouchableOpacity
                                        style={styles.addTimeButton}
                                        onPress={handleOpenTimePicker}
                                      >
                                        <ThemedText style={styles.addTimeButtonText}>
                                          + Add Reminder Time
                                        </ThemedText>
                                      </TouchableOpacity>
                          
                                      {showTimePicker && (
                                        <Modal transparent={true} animationType="slide">
                                          <View style={styles.modalOverlay}>
                                            <View style={styles.timePickerContainer}>
                                              <Text style={styles.timePickerTitle}>Select Time</Text>
                                              
                                              <View style={styles.timePickerColumns}>
                                                <ScrollView style={styles.timeColumn}>
                                                  {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                                                    <TouchableOpacity 
                                                      key={`hour-${hour}`}
                                                      style={[
                                                        styles.timeOption,
                                                        hour === selectedHour && styles.selectedTimeOption
                                                      ]}
                                                      onPress={() => setSelectedHour(hour)}
                                                    >
                                                      <Text style={[
                                                        styles.timeOptionText,
                                                        hour === selectedHour && styles.selectedTimeOptionText
                                                      ]}>
                                                        {hour.toString().padStart(2, '0')}
                                                      </Text>
                                                    </TouchableOpacity>
                                                  ))}
                                                </ScrollView>
                                                
                                                <ScrollView style={styles.timeColumn}>
                                                {Array.from({ length: 61}, (_, i) => i).map(minute => (
                                                    <TouchableOpacity 
                                                      key={`minute-${minute}`}
                                                      style={[
                                                        styles.timeOption,
                                                        minute === selectedMinute && styles.selectedTimeOption
                                                      ]}
                                                      onPress={() => setSelectedMinute(minute)}
                                                    >
                                                      <Text style={[
                                                        styles.timeOptionText,
                                                        minute === selectedMinute && styles.selectedTimeOptionText
                                                      ]}>
                                                        {minute.toString().padStart(2, '0')}
                                                      </Text>
                                                    </TouchableOpacity>
                                                  ))}
                                                </ScrollView>
                                              </View>
                                              
                                              <View style={styles.timePickerActions}>
                                                <TouchableOpacity 
                                                  style={styles.timePickerCancelButton}
                                                  onPress={() => setShowTimePicker(false)}
                                                >
                                                  <Text style={styles.timePickerButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                
                                                <TouchableOpacity 
                                                  style={styles.timePickerConfirmButton}
                                                  onPress={handleTimeConfirm}
                                                >
                                                  <Text style={styles.timePickerButtonText}>Confirm</Text>
                                                </TouchableOpacity>
                                              </View>
                                            </View>
                                          </View>
                                        </Modal>
                                      )}
            
              
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <ThemedText style={styles.submitText}>Save Changes</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginLeft: 15,
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  innerContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#E6F4EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  optionButton: {
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayButtonText: {
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
  },
  addTimeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  addTimeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeText: {
    paddingVertical: 4,
    fontSize: 16,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  confirmationText: {
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    maxHeight: '60%',
    padding: 20,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  timePickerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeColumn: {
    flex: 1,
    maxHeight: 200,
  },
  timeOption: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  timeOptionText: {
    fontSize: 18,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: 'white',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerCancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  timePickerConfirmButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  timePickerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});