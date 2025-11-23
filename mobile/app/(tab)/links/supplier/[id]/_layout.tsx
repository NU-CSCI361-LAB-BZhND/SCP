import { Stack } from 'expo-router';

export default function LinksLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: 'Supplier Details' }}/>
      <Stack.Screen name='order' options={{ title: 'New Order' }}/>
    </Stack>
  );
}
