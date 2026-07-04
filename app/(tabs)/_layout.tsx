import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#14141C' },
        headerTintColor: '#F3EAD8',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: '#1E1E2A', borderTopColor: '#2E2E3E' },
        tabBarActiveTintColor: '#C9403A',
        tabBarInactiveTintColor: '#7E7A70',
        sceneStyle: { backgroundColor: '#14141C' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dojo',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Séances',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
