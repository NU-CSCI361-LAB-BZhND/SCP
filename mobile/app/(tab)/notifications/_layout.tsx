import { Stack } from 'expo-router';
import Logout from '@/components/logout';

export default function NotificationsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Notifications',
          headerRight: () => <Logout/>,
        }}
      />
    </Stack>
  );
};
