import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Login() {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View style={{ flex: 1, maxWidth: 300, gap: 10 }}>
        <Text>Enter as:</Text>
        <Button
          title='Supplier'
          onPress={() => router.replace('/links?as=supplier')}
        />
        <Button
          title='Consumer'
          onPress={() => router.replace('/links?as=consumer')}
        />
      </View>
    </View>
  );
};
