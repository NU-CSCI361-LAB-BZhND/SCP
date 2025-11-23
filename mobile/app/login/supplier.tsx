import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Button, KeyboardAvoidingView, Platform, Text, View,
} from 'react-native';
import BorderedInput from '@/components/borderedinput';
import { GlobalContext } from '@/util/context';
import { callPost } from '@/util/fetch';

type LoginResult = {
  access: string;
  refresh: string;
};

export default function SupplierLogin() {
  const router = useRouter();
  const context = useContext(GlobalContext);
  const [error,    setError   ] = useState('');
  const [email,    setEmail   ] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View style={{ flex: 1, maxWidth: 300, gap: 5 }}>
        {error && (<>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <Text style={{ color: 'red' }}>Try again</Text>
        </>)}
        <Text>Email:</Text>
        <BorderedInput
          onChangeText={setEmail}
          value={email}
          placeholder='example@example.com'
          inputMode='email'
        />
        <Text>Password:</Text>
        <BorderedInput
          onChangeText={setPassword}
          value={password}
          placeholder='Password'
          inputMode='password'
        />
        <View/>
        <Button
          title='Login'
          onPress={() => {
            callPost<LoginResult>(
              '/api/auth/login/',
              context,
              { email, password },
            ).then(result => {
              router.back();
              router.replace('/links');
              context.setAccessToken(result.access);
              context.setRefreshToken(result.refresh);
            }).catch(err => {
              setError(String(err));
            });
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
