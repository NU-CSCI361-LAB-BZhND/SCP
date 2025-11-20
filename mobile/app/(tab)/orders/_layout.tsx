import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{ title: 'Orders' }}
      />
      <Stack.Screen
        name='items'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='order/[id]'
        options={{ title: 'Order Details' }}
      />
    </Stack>
  );
}
