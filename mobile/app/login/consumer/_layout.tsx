import { Stack } from 'expo-router';

export default function ConsumerLoginLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: 'Login (Consumer)' }}/>
      <Stack.Screen name='register' options={{ title: 'Register (Consumer)' }}/>
    </Stack>
  );
};
