import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Button, KeyboardAvoidingView, Platform, Text, View,
} from 'react-native';
import BorderedInput from '@/components/borderedinput';
import { callMethod } from '@/util/fetch';

type RegisterResult = {
  email: string;
  role: string;
};

export default function ConsumerRegister() {
  const router = useRouter();
  const [ error,          setError          ] = useState('');
  const [ email,          setEmail          ] = useState('');
  const [ password,       setPassword       ] = useState('');
  const [ companyName,    setCompanyName    ] = useState('');
  const [ companyAddress, setCompanyAddress ] = useState('');
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
        <Text>Company name:</Text>
        <BorderedInput
          onChangeText={setCompanyName}
          value={companyName}
          placeholder='Company name'
          inputMode='text'
        />
        <Text>Company address:</Text>
        <BorderedInput
          onChangeText={setCompanyAddress}
          value={companyAddress}
          placeholder='Company address'
          inputMode='text'
        />
        <View/>
        <Button
          title='Register'
          onPress={() => {
            callMethod<RegisterResult>(
              'POST',
              '/api/auth/register/',
              {
                email,
                password,
                role: 'CONSUMER',
                company_name: companyName,
                company_address: companyAddress,
              },
            ).then(result => {
              router.back();
            }).catch(err => {
              setError(String(err));
            });
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
