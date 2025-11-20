import { Stack } from 'expo-router';

export default function LinksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{ title: 'Supplier Consumer Platform' }}
      />
      <Stack.Screen
        name='supplier/[id]'
        options={{ title: 'Supplier Details' }}
      />
    </Stack>
  );
}
