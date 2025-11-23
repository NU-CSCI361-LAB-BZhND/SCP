import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name='links'
        options={{
          title: "Links",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="link" color={color} size={size}/>
          )
        }}
      />
      <Tabs.Screen
        name='orders'
        options={{
          title: "Orders",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" color={color} size={size}/>
          )
        }}
      />
      <Tabs.Screen
        name='chat'
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" color={color} size={size}/>
          ),
        }}
      />
    </Tabs>
  );
};
