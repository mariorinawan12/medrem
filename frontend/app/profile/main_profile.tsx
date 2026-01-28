import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    Pressable,
    TextInput,
    Modal,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchUserDetails } from '@/lib/auth';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePickerModal from '@/components/DatePickerModal';
import { updateUserDetails } from '@/lib/auth';

const genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

type Gender = 'Male' | 'Female' | 'Other';
type GenderWithEmpty = Gender | '';

export default function UserDetailsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
    const [saving, setSaving] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [gender, setGender] = useState<GenderWithEmpty>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const genderInputRef = useRef<View>(null);

    useEffect(() => {
        const getUser = async () => {
            try {
                const res = await fetchUserDetails();
                const user = res.user;
                setEmail(user.email);
                setFullName(user.fullName);
                setGender(user.gender);
                setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : new Date());
                
                const userRole = await AsyncStorage.getItem('role');
                setRole(userRole || '');
            } catch (err) {
                console.error('Failed to fetch user details:', err);
            } finally {
                setLoading(false);
            }
        };
        getUser();
    }, []);

    const handleGenderPress = () => {
        setShowGenderPicker(true);
    };

    const handleSave = async () => {
        try {
          setSaving(true);
          
          // Prepare the data to send
          const userData = {
            fullName,
            gender,
            dateOfBirth: dateOfBirth.toISOString().split('T')[0] // Format as YYYY-MM-DD
          };
      
          // Call your API function
          const result = await updateUserDetails(userData);
          
          // Handle success
          Alert.alert('Success', 'Profile updated successfully');
          console.log('Update result:', result);
          
          // Optional: Refresh user data
          const res = await fetchUserDetails();
          const user = res.user;
          setFullName(user.fullName);
          setGender(user.gender);
          setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : new Date());
      
        } catch (error) {
          console.error('Update error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
          Alert.alert('Error', errorMessage);
        } finally {
          setSaving(false);
        }
      };

    const handleGenderSelect = (value: Gender) => {
        setGender(value);
        setShowGenderPicker(false);
    };

    const handleDateConfirm = (selectedDate: Date) => {
        setDateOfBirth(selectedDate);
        setShowDatePicker(false);
    };

    const handleDateCancel = () => {
        setShowDatePicker(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38A169" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                    {/* <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={20}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </Pressable> */}
                     <Pressable 
                                                  onPress={() => role === 'dependent_user' ? router.replace('/(drawer)/(tabs-dependent)/home') : router.replace('/(drawer)/(tabs-amain)/home')} 
                                                  style={styles.backButton}
                                                >
                                            <Ionicons name="arrow-back" size={24} color="#000" />
                                        </Pressable>
                    <Text style={styles.title}>Edit Profile</Text>
                </View>
    
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.profileSection}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={48} color="#38A169" />
                        </View>
                    </View>
    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                            />
                        </View>

                        {role !== 'dependent_user' ? (    <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={false}
                            />
                        </View>) : null}
                    
    
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <Pressable 
                                ref={genderInputRef}
                                style={styles.genderInput}
                                onPress={handleGenderPress}
                            >
                                <Text style={gender ? styles.genderText : styles.genderPlaceholder}>
                                    {gender || 'Select gender'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </Pressable>
                        </View>
    
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date of Birth</Text>
                            <Pressable 
                                style={styles.dateInput}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                                    {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date of Birth'}
                                </Text>
                                <Ionicons name="calendar" size={20} color="#4CAF50" />
                            </Pressable>
                        </View>
                    </View>
                    <View style={styles.section}>
    <Text style={styles.sectionTitle}>Account Information</Text>
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Account Type:</Text>
        <Text style={styles.infoValue}>
            {role === 'dependent_user' ? 'Dependent User' : 
             role === 'main_user' ? 'Main User' : 
             role ? role.charAt(0).toUpperCase() + role.slice(1) : 'N/A'}
        </Text>
    </View>
</View>
    
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            pressed && styles.saveButtonPressed,
                            saving && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </Pressable>
    
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
                        
                        <View style={styles.genderModalContent}>
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.genderOption,
                                        gender === option.value && styles.selectedGenderOption
                                    ]}
                                    onPress={() => handleGenderSelect(option.value)}
                                >
                                    <Text style={styles.genderOptionText}>{option.label}</Text>
                                    {gender === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#38A169" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Modal>

                    {/* Date Picker Modal */}
                    <DatePickerModal
                        visible={showDatePicker}
                        value={dateOfBirth}
                        onConfirm={handleDateConfirm}
                        onCancel={handleDateCancel}
                        maximumDate={new Date()}
                        title="Select Date of Birth"
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    innerContainer: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E6FFFA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#B2F5EA',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 15,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A5568',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
        color: '#2D3748',
    },
    disabledInput: {
        backgroundColor: '#F7FAFC',
        color: '#718096',
    },
    genderInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'white',
    },
    genderText: {
        fontSize: 16,
        color: '#2D3748',
    },
    genderPlaceholder: {
        fontSize: 16,
        color: '#718096',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'white',
    },
    dateText: {
        fontSize: 16,
        color: '#2D3748',
    },
    datePlaceholder: {
        fontSize: 16,
        color: '#718096',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#2D3748',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    saveButtonPressed: {
        backgroundColor: '#2F855A',
    },
    saveButtonDisabled: {
        backgroundColor: '#9AE6B4',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    genderModalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -150 }, { translateY: -100 }],
        width: 300,
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
        backgroundColor: '#f0f9f0',
    },
    genderOptionText: {
        fontSize: 16,
        color: '#333',
    },
});