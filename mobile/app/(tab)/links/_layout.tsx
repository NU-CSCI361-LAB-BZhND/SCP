import { Stack } from 'expo-router';
import Logout from '@/components/logout';

export default function LinksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Supplier Consumer Platform',
          headerRight: () => <Logout/>,
        }}
      />
      <Stack.Screen name='supplier/[id]' options={{ headerShown: false }}/>
      <Stack.Screen
        name='link/[id]'
        options={{ title: 'Consumer Details' }}
      />
    </Stack>
  );
}
