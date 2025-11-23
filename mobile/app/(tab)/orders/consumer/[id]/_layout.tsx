import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name='complaint'
        options={{ title: 'File Complaint' }}
      />
      <Stack.Screen
        name='complaints'
        options={{ title: 'Order Complaints' }}
      />
    </Stack>
  );
};
