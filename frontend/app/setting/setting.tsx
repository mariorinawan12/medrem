import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { fetchNotificationSettings } from '@/lib/medication';
import { updateNotificationSettings } from '@/lib/medication';
import { scheduleMedicationNotifications, clearAllMedicationNotifications } from '@/lib/notification-helper';
import { getMedicationSchedule } from '@/lib/medication';
import AsyncStorage from '@react-native-async-storage/async-storage';


const NotificationSettingsScreen = () => {
    const router = useRouter();
    const [interval, setInterval] = useState('');
    const [count, setCount] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await fetchNotificationSettings();
                setInterval(settings.followUpIntervalMinutes.toString());
                setCount(settings.followUpCount.toString());
            } catch (error) {
                Alert.alert('Error', 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();

        const fetchUserRole = async () => {
            try {
                const role = await AsyncStorage.getItem('role');
                setUserRole(role);
            } catch (error) {
                console.error('Failed to fetch user role:', error);
            }
        }
        fetchUserRole();
    }, []);

    const handleSave = async () => {
        if (!interval || !count) return;

        try {
            setSaving(true);
            console.log('Saving settings:', { interval, count });
            await updateNotificationSettings({
                followUpIntervalMinutes: parseInt(interval, 10),
                followUpCount: parseInt(count, 10),
            });
            Alert.alert('Success', 'Settings updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setSaving(false);
            // Clear all previous notifications
            await clearAllMedicationNotifications();

            const medicationSchedule = await getMedicationSchedule();
            if (medicationSchedule && medicationSchedule.length > 0) {
                await scheduleMedicationNotifications(medicationSchedule);
            } else {
                console.warn('No medication schedule found to schedule notifications.');
            }
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                     <Pressable 
                              onPress={() => userRole === 'dependent_user' ? router.replace('/(drawer)/(tabs-dependent)/home') : router.replace('/(drawer)/(tabs-amain)/home')} 
                              style={styles.backButton}
                            >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </Pressable>
                    <Text style={[styles.title, { color: '#000', fontWeight: 'bold' }]}>
                        Settings
                    </Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View style={styles.box}>
                        <Text style={[styles.boxTitle, { color: '#000', fontWeight: '600' }]}>Follow-up Interval (minutes)</Text>
                        <Text style={[styles.boxDescription, { color: '#666' }]}>
                            How many minutes to wait before sending a follow-up reminder if the medication is not marked as taken.
                        </Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={interval}
                            onChangeText={setInterval}
                            placeholder="e.g. 15"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.box}>
                        <Text style={[styles.boxTitle, { color: '#000', fontWeight: '600' }]}>Follow-up Count</Text>
                        <Text style={[styles.boxDescription, { color: '#666' }]}>
                            How many follow-up reminders should be sent if the medication is still not marked as taken.
                        </Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={count}
                            onChangeText={setCount}
                            placeholder="e.g. 3"
                            placeholderTextColor="#999"
                        />
                    </View>



                    <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
                    </Pressable>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    innerContainer: {
        flex: 1,
        padding: 16,
    },
    description: {
        fontSize: 12,
        color: '#555',
        marginBottom: 6,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 24,
        lineHeight: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    saveButton: {
        marginTop: 24,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    box: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    boxTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        color: '#333',
    },

    boxDescription: {
        fontSize: 12,
        color: '#777',
        marginBottom: 12,
    },

    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        backgroundColor: 'white',
    },

});

export default NotificationSettingsScreen;
