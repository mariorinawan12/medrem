import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  SafeAreaView, 
  Dimensions, 
  Modal,
  TouchableWithoutFeedback,
  Pressable
} from 'react-native';
import { createDependent } from '@/lib/dependent';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DatePickerModal from '@/components/DatePickerModal';

// --- Custom Hook untuk posisi Dropdown (Dari Register) ---
const useDropdownPosition = (ref: React.RefObject<View | null>) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, visibleHeight: 0 });

  const measurePosition = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const spaceBelow = screenHeight - y - height;
      const spaceAbove = y;
      
      // Position the dropdown below if there's enough space, otherwise above
      const top = spaceBelow > 200 ? y + height + 10 : y - 200 - 10;
      
      setPosition({
        top,
        left: x,
        width,
        visibleHeight: Math.min(200, Math.max(spaceBelow, spaceAbove))
      });
    });
  };

  return [position, measurePosition] as const;
};

// --- Tipe Data ---
interface DependentData {
  fullName: string;
  gender: string;
  dateOfBirth: Date;
}

type GenderOption = {
  label: string;
  value: string;
};

export default function CreateDependent() {
  const router = useRouter();
  
  // State Form
  const [dependentData, setDependentData] = useState<DependentData>({
    fullName: '',
    gender: '',
    dateOfBirth: new Date(),
  });
  const [age, setAge] = useState<number>(0);
  
  // State UI/Loading
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // State Date Picker
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // State Gender Picker (Custom seperti Register)
  const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
  const genderInputRef = useRef<View>(null);
  const [genderPosition, measureGenderPosition] = useDropdownPosition(genderInputRef);

  const genderOptions: GenderOption[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'undisclosed' },
  ];

  const handleChange = (name: keyof DependentData, value: string | Date) => {
    setDependentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Logic Gender Picker ---
  const handleGenderPress = () => {
    measureGenderPosition();
    setShowGenderPicker(true);
  };

  const handleGenderSelect = (value: string) => {
    handleChange('gender', value);
    setShowGenderPicker(false);
  };

  // --- Logic Date Picker ---
  const handleDateConfirm = (selectedDate: Date) => {
    handleChange('dateOfBirth', selectedDate);
    calculateAge(selectedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setAge(age);
    return age;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!dependentData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!dependentData.gender) {
      setError('Please select gender');
      setLoading(false);
      return;
    }
    if (calculateAge(dependentData.dateOfBirth) < 0) {
      setError('Please enter a valid date of birth');
      setLoading(false);
      return;
    }

    const currentAge = calculateAge(dependentData.dateOfBirth);

    try {
      const submissionData = {
        ...dependentData,
        age: currentAge,
      };
      await createDependent(submissionData);
      console.log('Dependent created successfully:', submissionData);
      setSuccess(true);

      setTimeout(() => {
        router.replace('/dependents');
      }, 10);

      setDependentData({
        fullName: '',
        gender: '',
        dateOfBirth: new Date(),
      });


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dependent');
    } finally {
      setLoading(false);
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Dependent</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>Step 1 of 1</Text>
              <Text style={styles.statusTitle}>Account Setup</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {success && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>Dependent created successfully!</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={dependentData.fullName}
                  onChangeText={(text) => handleChange('fullName', text)}
                  placeholder="John Doe"
                  autoCapitalize="words"
                />
              </View>

              {/* GENDER PICKER (Updated to match Register Style) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <Pressable 
                  ref={genderInputRef}
                  style={styles.genderInput}
                  onPress={handleGenderPress}
                >
                  <Text style={dependentData.gender ? styles.genderText : styles.genderPlaceholder}>
                    {dependentData.gender ? 
                      genderOptions.find(opt => opt.value === dependentData.gender)?.label : 
                      'Select Gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#1a8e2d" />
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.dateInput} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={dependentData.dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                    {dependentData.dateOfBirth ? 
                      dependentData.dateOfBirth.toLocaleDateString() : 
                      'Select Date of Birth'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#1a8e2d" />
                </TouchableOpacity>
              </View>

              <DatePickerModal
                visible={showDatePicker}
                value={dependentData.dateOfBirth}
                onConfirm={handleDateConfirm}
                onCancel={handleDateCancel}
                maximumDate={new Date()}
                title="Select Date of Birth"
              />
              
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Dependent</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>About Dependents</Text>
              <Text style={styles.infoText}>
                Dependents will have limited access to your account and can only view their own information.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Gender Picker Modal (Added from Register) */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGenderPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.modalContent, 
          { 
            top: genderPosition.top, // Menggunakan calculated top
            left: genderPosition.left,
            width: genderPosition.width,
            maxHeight: genderPosition.visibleHeight
          }
        ]}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderOption,
                dependentData.gender === option.value && styles.selectedGenderOption
              ]}
              onPress={() => handleGenderSelect(option.value)}
            >
              <Text style={styles.genderOptionText}>{option.label}</Text>
              {dependentData.gender === option.value && (
                <Ionicons name="checkmark" size={20} color="#1a8e2d" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

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
  scrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  innerContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#ebfbee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d3f9d8',
  },
  statusText: {
    fontSize: 12,
    color: '#2b8a3e',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b8a3e',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  // --- Gender Input Styles (New) ---
  genderInput: {
    width: '100%',
    height: 54, // Adjusted height to match padding of other inputs
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  genderText: {
    fontSize: 16,
    color: '#212529',
  },
  genderPlaceholder: {
    fontSize: 16,
    color: '#c7c7cd', // Placeholder color standard
  },
  // --- End Gender Input Styles ---
  dateInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#212529',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#6c757d',
  },
  button: {
    backgroundColor: '#2b8a3e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#74c276',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffe3e3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffc9c9',
  },
  errorText: {
    color: '#c92a2a',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#d3f9d8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b2f2bb',
  },
  successText: {
    color: '#2b8a3e',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#ebfbee',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d3f9d8',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2b8a3e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#2b8a3e',
  },
  // --- Modal Styles (Copied & Adapted) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedGenderOption: {
    backgroundColor: '#ebfbee', // Adapted to match theme
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
});