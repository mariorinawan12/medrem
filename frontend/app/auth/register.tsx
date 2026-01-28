import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DatePickerModal from '@/components/DatePickerModal';
import { register } from '@/lib/auth';

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string; // Optional for registration
  gender: string;
  dateOfBirth: Date;
};

type GenderOption = {
  label: string;
  value: string;
};

//const { width } = Dimensions.get('window');

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


export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: new Date(),
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
  const genderInputRef = useRef<View>(null);
  const [genderPosition, measureGenderPosition] = useDropdownPosition(genderInputRef);

  const genderOptions: GenderOption[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleGenderPress = () => {
    measureGenderPosition();
    setShowGenderPicker(true);
  };

  const handleGenderSelect = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setShowGenderPicker(false);
  };

  const handleChange = (name: keyof FormData, value: string | Date): void => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDatePickerOpen = () => {
    setShowDatePickerModal(true);
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
    setShowDatePickerModal(false);
  };

  const handleDateCancel = () => {
    setShowDatePickerModal(false);
  };

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }
    return true;
  };
  

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsRegistering(true);
    setError(null);

    try {
      const age = calculateAge(formData.dateOfBirth);
      const dataToRegister = { ...formData, age };
      
      await register(dataToRegister);
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name='person-add' size={80} color='white' />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to manage your medication easily</Text>

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#999"
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#999"
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#999"
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>Confirm Password</Text>
  <TextInput
    placeholder="Re-enter Password"
    placeholderTextColor="#999"
    style={styles.input}
    value={formData.confirmPassword}
    onChangeText={(text) => handleChange('confirmPassword', text)}
    secureTextEntry
  />
</View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender</Text>
              <Pressable 
                ref={genderInputRef}
                style={styles.genderInput}
                onPress={handleGenderPress}
              >
                <Text style={formData.gender ? styles.genderText : styles.genderPlaceholder}>
                  {formData.gender ? 
                    genderOptions.find(opt => opt.value === formData.gender)?.label : 
                    'Select Gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <Pressable 
                style={styles.dateInput}
                onPress={handleDatePickerOpen}
              >
                <Text style={formData.dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                  {formData.dateOfBirth ? 
                    formData.dateOfBirth.toLocaleDateString() : 
                    'Select Date of Birth'}
                </Text>
                <Ionicons name="calendar" size={20} color="#4CAF50" />
              </Pressable>
            </View>

            <TouchableOpacity 
              style={[styles.button, isRegistering && styles.buttonDisabled]} 
              onPress={handleRegister} 
              disabled={isRegistering}
              activeOpacity={0.8}
            >
              {isRegistering ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Gender Picker Modal */}
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
            top: 400,
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
                formData.gender === option.value && styles.selectedGenderOption
              ]}
              onPress={() => handleGenderSelect(option.value)}
            >
              <Text style={styles.genderOptionText}>{option.label}</Text>
              {formData.gender === option.value && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <DatePickerModal
          visible={showDatePickerModal}
          value={formData.dateOfBirth}
          onConfirm={handleDateConfirm}
          onCancel={handleDateCancel}
          maximumDate={new Date()}
          title="Select Date of Birth"
        />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  genderInput: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  genderPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dateInput: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    width: '100%',
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  loginContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 15,
  },
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
  dateModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedGenderOption: {
    backgroundColor: '#f0f9f0',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});