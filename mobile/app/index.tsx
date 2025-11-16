import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  return <Redirect href='/login'/>;
};
