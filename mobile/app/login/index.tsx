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
          onPress={() => router.push('/login/supplier')}
        />
        <Button
          title='Consumer'
          onPress={() => router.push('/login/consumer')}
        />
      </View>
    </View>
  );
};
