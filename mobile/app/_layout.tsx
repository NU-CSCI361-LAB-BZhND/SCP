import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { GlobalContext } from '@/util/context';
import type { LinkedSupplier } from '@/types/supplier';

export default function RootLayout() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [update, setUpdate] = useState(0);
  const linkedSupplierCache = useRef<LinkedSupplier[]>([]);
  return (
    <GlobalContext.Provider
      value={{
        accessToken,
        setAccessToken,
        refreshToken,
        setRefreshToken,
        update,
        forceUpdate: () => setUpdate(update + 1),
        linkedSupplierCache,
      }}
    >
      <Stack>
        <Stack.Screen name='login' options={{ headerShown: false }}/>
        <Stack.Screen name='(tab)' options={{ headerShown: false }}/>
      </Stack>
    </GlobalContext.Provider>
  );
};
