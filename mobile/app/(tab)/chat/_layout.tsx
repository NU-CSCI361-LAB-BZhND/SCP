import { Stack } from 'expo-router';
import Logout from '@/components/logout';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Chat',
          headerRight: () => <Logout/>,
        }}
      />
    </Stack>
  );
};
