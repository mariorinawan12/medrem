import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: 'white',
          height: 50,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          marginVertical: 0,
          height: 50,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medication-management"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="medkit" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dependents"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="people" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
