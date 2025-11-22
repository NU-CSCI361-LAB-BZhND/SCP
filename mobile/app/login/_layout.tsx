import { Stack } from 'expo-router';

export default function LoginLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: 'Login' }}/>
      <Stack.Screen name='supplier' options={{ title: 'Login (Supplier)' }}/>
      <Stack.Screen name='consumer' options={{ headerShown: false }}/>
    </Stack>
  );
};
