// components/CustomDrawerContent.tsx
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity } from 'react-native';

// In your CustomDrawerContent.tsx
export function CustomDrawerContent(props: DrawerContentComponentProps) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        {/* Your custom content */}
        <View style={{ marginTop: 50 }}>
          <TouchableOpacity 
            onPress={() => {
              props.navigation.closeDrawer();
              // Handle logout
            }}
            style={{ padding: 15 }}
          >
            <Text>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }