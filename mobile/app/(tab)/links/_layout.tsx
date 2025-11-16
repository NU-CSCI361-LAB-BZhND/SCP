import { Stack } from 'expo-router';
import type { IndexSearchParams } from '@/types/index';

export default function LinksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={({ route }: { route: { params?: IndexSearchParams } }) => ({
          title: 'SCP' + (
            route?.params?.as !== undefined ? ` (${
              route.params.as.charAt(0).toUpperCase()
            }${
              route.params.as.slice(1)
            })` : ''
          ),
        })}
      />
      <Stack.Screen
        name='supplier/[id]'
        options={{ title: 'Supplier details' }}
        presentation='modal'
      />
    </Stack>
  );
}
