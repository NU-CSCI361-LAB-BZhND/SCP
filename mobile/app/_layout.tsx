import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name='login' options={{ title: 'Login' }}/>
      <Stack.Screen name='(tab)' options={{ headerShown: false }}/>
    </Stack>
  );
};
