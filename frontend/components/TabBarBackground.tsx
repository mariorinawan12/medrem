// components/ui/TabBarBackground.tsx

import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabBarBackground() {
  return (
    <BlurView
      intensity={40}
      tint="light"
      style={{
        flex: 1,
        overflow: 'hidden',
      }}
    />
  );
}
