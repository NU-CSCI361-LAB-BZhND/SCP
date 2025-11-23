import { Stack } from 'expo-router';
import Logout from '@/components/logout';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Orders',
          headerRight: () => <Logout/>,
        }}
      />
      <Stack.Screen
        name='supplier/[id]'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='consumer/[id]'
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
