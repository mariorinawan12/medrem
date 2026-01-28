import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createMedicationForDependent } from '@/lib/medication-dependent';

const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].slice(0, 8); // HH:mm:ss
};

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
  const { userId, refresh, fullName} = useLocalSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [medicationType, setMedicationType] = useState('medication');
  const [medicationForm, setMedicationForm] = useState('pills');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['everyday']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tempTime, setTempTime] = useState<string | null>(null);

  const handleAddTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      selectedDate.setSeconds(0); // Set seconds to 0 for consistency
      const timeString = formatTime(selectedDate);
      setTempTime(timeString);
    }
  };

  const handleConfirmTime = () => {
    if (tempTime) {
      setReminderTimes((prevTimes) => [...prevTimes, tempTime]);
      setTempTime(null);
    }
  };

  const handleDeleteTime = (timeToDelete: string) => {
    setReminderTimes((prevTimes) => prevTimes.filter((time) => time !== timeToDelete));
  };

  const toggleDayOfWeek = (day: string) => {
    if (day === 'everyday') {
      setDaysOfWeek(['everyday']);
    } else {
      setDaysOfWeek((prevDays) => {
        // Remove 'everyday' if any specific day is selected
        const filteredDays = prevDays.filter(d => d !== 'everyday');
        
        // Toggle the selected day
        if (filteredDays.includes(day)) {
          return filteredDays.filter(d => d !== day);
        } else {
          return [...filteredDays, day];
        }
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
        params: { refresh: 'true', userId: userId.toString(), fullName: fullName.toString() },
      });
    } catch (err) {
      console.error('Failed to add medication:', err);
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>
              Medication Name
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              What is the name of your medication?
            </ThemedText>
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
            <ThemedText type="title" style={styles.stepTitle}>
              Medication Type
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Is this a medication or vitamin?
            </ThemedText>
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
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>
              Dosage Information
            </ThemedText>
            <ThemedText style={[styles.stepDescription, { marginTop: 20 }]}>
              What form is your medication in?
            </ThemedText>
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
            <ThemedText style={styles.stepDescription}>
              How much do you take per dose?
            </ThemedText>
            <TextInput
              placeholder="e.g., 200"
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
              style={styles.input}
              autoFocus
            />

            <ThemedText style={styles.stepDescription}>
              How many doses do you currently have?
            </ThemedText>
            <TextInput
              placeholder="e.g., 30"
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              style={styles.input}
              autoFocus
            />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>
              Reminder Schedule
            </ThemedText>
            
            <ThemedText style={styles.stepDescription}>
              Which days should we remind you?
            </ThemedText>
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

            {Platform.OS === 'web' ? (
              <View style={styles.webTimeInput}>
                <ThemedText style={{ marginBottom: 6 }}>Select Time:</ThemedText>
                <input
                  type="time"
                  onChange={(e) => {
                    const time = e.target.value + ':00';
                    setReminderTimes((prev) => [...prev, time]);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    borderColor: '#ccc',
                    marginBottom: 10,
                  }}
                />
              </View>
            ) : (
              <>
                {showTimePicker && (
                  <DateTimePicker
                    value={currentTime}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleAddTime}
                  />
                )}

{tempTime && (
  <View style={styles.confirmationContainer}>
    <ThemedText style={styles.confirmationText}>
      Add {tempTime} as reminder?
    </ThemedText>
    <View style={styles.buttonRow}>
      <TouchableOpacity
        onPress={handleConfirmTime}
        style={styles.confirmButton}
      >
        <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setTempTime(null)} // Cancel action
        style={styles.cancelButton}
      >
        <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
      </TouchableOpacity>
    </View>
  </View>
)}


                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <ThemedText style={styles.addTimeButtonText}>
                    + Add Reminder Time
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <ThemedView style={styles.container}>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Add New Medication
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((stepNumber) => (
            <View
              key={stepNumber}
              style={[
                styles.progressStep,
                stepNumber === step && styles.activeStep,
                stepNumber < step && styles.completedStep,
              ]}
            >
              <ThemedText
                style={[
                  styles.progressText,
                  (stepNumber === step || stepNumber < step) && styles.activeProgressText,
                ]}
              >
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
              disabled={
                (step === 1 && !name) ||
                (step === 3 && !dosage) ||
                (step === 4 && !stockQuantity)
              }
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
    </ThemedView>
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
  confirmationContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 20,
  },
  
  confirmationText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  
  webTimeInput: {
    marginTop: 15,
    marginBottom: 20,
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
});