import { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
//import { ThemedView } from '@/components/ThemedView';
import { createMedicationForDependent } from '@/lib/medication-dependent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parse } from '@babel/core';

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

export default function AddMedicationScreen() {
  //const { userId, refresh, fullName} = useLocalSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [medicationType, setMedicationType] = useState('medication');
  const [medicationForm, setMedicationForm] = useState('pills');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['everyday']);
  const [userRole, setUserRole] = useState<string | null>(null);
    const { userId, fullName, refresh } = useLocalSearchParams<{ 
      userId: string; 
      fullName: string; 
      refresh?: string 
    }>();
  
  // Custom Time Picker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const fetchUserRole = async () => {
    let role = null;
    try {
      role = await AsyncStorage.getItem('role');
      setUserRole(role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
    return role;
  };

  // Custom Time Picker Handlers
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

  const toggleDayOfWeek = (day: string) => {
    if (day === 'everyday') {
      setDaysOfWeek(['everyday']);
    } else {
      setDaysOfWeek(prevDays => {
        const filteredDays = prevDays.filter(d => d !== 'everyday');
        return filteredDays.includes(day) 
          ? filteredDays.filter(d => d !== day)
          : [...filteredDays, day];
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const body = {
        userId: parseInt(userId as string),
        name,
        dosage: parseInt(dosage),
        stockQuantity: parseInt(stockQuantity),
        medicationType,
        medicationForm,
        reminderTimes,
        daysOfWeek: daysOfWeek.includes('everyday') ? ['everyday'] : daysOfWeek,
      };
        await createMedicationForDependent(body);
        router.replace({
            pathname: '/dependents/[userId]/medication-management',
            params: { refresh : 'true', userId : userId.toString(), fullName: fullName.toString() },
        })
    } catch (err) {
      console.error('Failed to add medication:', err);
    }
  };

  const nextStep = () => step < 5 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>Medication Name</ThemedText>
            <ThemedText style={styles.stepDescription}>What is the name of your medication?</ThemedText>
            <TextInput
              placeholder="e.g., Ibuprofen"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoFocus
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>Medication Type</ThemedText>
            <ThemedText style={styles.stepDescription}>Is this a medication or vitamin?</ThemedText>
            <View style={styles.optionsContainer}>
              {medicationTypeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, medicationType === option.value && styles.selectedOption]}
                  onPress={() => setMedicationType(option.value)}
                >
                  <ThemedText style={[styles.optionText, medicationType === option.value && styles.selectedOptionText]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>Dosage Information</ThemedText>
            <ThemedText style={[styles.stepDescription, { marginTop: 20 }]}>What form is your medication in?</ThemedText>
            <View style={styles.optionsContainer}>
              {medicationFormOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, medicationForm === option.value && styles.selectedOption]}
                  onPress={() => setMedicationForm(option.value)}
                >
                  <ThemedText style={[styles.optionText, medicationForm === option.value && styles.selectedOptionText]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <ThemedText style={styles.stepDescription}>How much do you take per dose?</ThemedText>
            <TextInput
              placeholder="e.g., 200"
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
              style={styles.input}
            />
            <ThemedText style={styles.stepDescription}>How many doses do you currently have?</ThemedText>
            <TextInput
              placeholder="e.g., 30"
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              style={styles.input}
            />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>Reminder Schedule</ThemedText>
            <ThemedText style={styles.stepDescription}>Which days should we remind you?</ThemedText>
            <View style={styles.daysContainer}>
              {daysOfWeekOptions.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.dayButton, daysOfWeek.includes(day.value) && styles.selectedDay]}
                  onPress={() => toggleDayOfWeek(day.value)}
                >
                  <ThemedText style={[styles.dayButtonText, daysOfWeek.includes(day.value) && styles.selectedDayText]}>
                    {day.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={[styles.stepDescription, { marginTop: 20 }]}>
              When should we remind you to take your medication?
            </ThemedText>

            {reminderTimes.length > 0 && (
              <View style={styles.timesList}>
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
              </View>
            )}

            {/* Custom Time Picker Implementation */}
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
        );
      default:
        return null;
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace({
            pathname: '/dependents/[userId]/medication-management',
            params: { refresh : 'true', userId : userId.toString(), fullName: fullName.toString() },
        })}>
              <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>Add New Medication</ThemedText>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map(stepNumber => (
              <View
                key={stepNumber}
                style={[
                  styles.progressStep,
                  stepNumber === step && styles.activeStep,
                  stepNumber < step && styles.completedStep,
                ]}
              >
                <ThemedText style={[styles.progressText, (stepNumber === step || stepNumber < step) && styles.activeProgressText]}>
                  {stepNumber}
                </ThemedText>
              </View>
            ))}
          </View>

          {renderStep()}

          <View style={[styles.buttonContainer, { justifyContent: step === 1 ? 'flex-end' : 'space-between' }]}>
            {step > 1 && (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <ThemedText style={styles.buttonText}>Back</ThemedText>
              </TouchableOpacity>
            )}

            {step < 4 ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextStep}
                disabled={(step === 1 && !name) || (step === 3 && !dosage) || (step === 4 && !stockQuantity)}
              >
                <ThemedText style={styles.buttonText}>Next</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={reminderTimes.length === 0}
              >
                <ThemedText style={styles.buttonText}>Submit</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContainer: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    color: '#333',
    fontSize: 24,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#E6F4EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    borderColor: '#4CAF50',
    backgroundColor: '#E6F4EA',
  },
  completedStep: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 16,
    color: '#ccc',
  },
  activeProgressText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  timesList: {
    marginVertical: 15,
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
  prevButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  optionButton: {
    padding: 12,
    margin: 4,
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
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    margin: 4,
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
  // Custom Time Picker Styles
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