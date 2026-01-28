import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Pressable
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DatePickerModal from '@/components/DatePickerModal';
import { fetchDependentDetails, updateDependentDetails } from '@/lib/dependent';

// --- Custom Hook untuk posisi Dropdown (Sama seperti di CreateDependent) ---
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

interface DependentData {
  userId: number;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
}

type GenderOption = {
  label: string;
  value: string;
};

const genderOptions: GenderOption[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'undisclosed' },
];

export default function EditDependent() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  
  // State Form
  const [dependentData, setDependentData] = useState<DependentData>({
    userId: parseInt(userId as string),
    fullName: '',
    gender: '',
    dateOfBirth: new Date(),
  });
  
  // State UI/Loading
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // State Date Picker
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // State Gender Picker (Custom)
  const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
  const genderInputRef = useRef<View>(null);
  const [genderPosition, measureGenderPosition] = useDropdownPosition(genderInputRef);

  useEffect(() => {
    const loadDependentData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        const dependent = await fetchDependentDetails(userId);
        
        if (dependent) {
          setDependentData({
            userId: dependent.userId,
            fullName: dependent.fullName,
            gender: dependent.gender || '',
            dateOfBirth: new Date(dependent.dateOfBirth),
          });
        } else {
          setError('Dependent not found');
        }
      } catch (err) {
        setError('Failed to load dependent data');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDependentData();
  }, [userId]);

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
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
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
  
    try {
      // Prepare data in exact format the API expects
      const updateData = {
        userId: dependentData.userId, 
        fullName: dependentData.fullName,
        gender: dependentData.gender,
        dateOfBirth: dependentData.dateOfBirth
      };
  
      await updateDependentDetails(updateData);
  
      Alert.alert(
        'Dependent Updated',
        `Name: ${dependentData.fullName}\nGender: ${dependentData.gender}\nDate of Birth: ${dependentData.dateOfBirth.toLocaleDateString()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSuccess(true);
              setTimeout(() => {
                router.back();
              }, 1500);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Update failed:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to update dependent');
      } else {
        setError('Failed to update dependent');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#1a8e2d" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 20 }]} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Edit Dependent</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>Editing Dependent</Text>
              <Text style={styles.statusTitle}>Update Information</Text>
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
                  <Text style={styles.successText}>Dependent updated successfully!</Text>
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

              {/* GENDER PICKER (Updated to match CreateDependent Style) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <Pressable 
                  ref={genderInputRef}
                  style={styles.genderInput}
                  onPress={handleGenderPress}
                >
                  <Text style={dependentData.gender ? styles.genderText : styles.genderPlaceholder}>
                    {dependentData.gender ? 
                      // Cari label yang sesuai, jika tidak ada tampilkan value as is
                      (genderOptions.find(opt => opt.value === dependentData.gender)?.label || dependentData.gender) : 
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
                  <Text style={styles.dateText}>
                    {dependentData.dateOfBirth.toLocaleDateString()}
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
                  <Text style={styles.buttonText}>Update Dependent</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Gender Picker Modal (Custom) */}
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
            top: genderPosition.top,
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
  // --- Gender Input Styles (New from CreateDependent) ---
  genderInput: {
    width: '100%',
    height: 54,
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
    color: '#c7c7cd',
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
  // --- Modal Styles (From CreateDependent) ---
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
    backgroundColor: '#ebfbee',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
});