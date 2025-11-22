import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ScrollView, Text } from 'react-native';
import { ITEMS } from '@/app/(tab)/orders/items/index';
import BorderedInput from '@/components/borderedinput';
import type { ItemSearchParams } from '@/types/item';

export default function ItemDetails() {
  const router = useRouter();
  const { id: strId = undefined!, supplier: strSid = undefined! } =
    useLocalSearchParams<ItemSearchParams>();
  const id = +strId;
  const sid = +strSid;
  const { name, description, quantity } =
    ITEMS.find(item => item.id == id && item.supplier == sid)!;
  return (
    <ScrollView style={{ padding: 10 }}>
      <Text style={{ fontSize: 20 }}>Item name: {name}</Text>
      <Text>Quantity: {quantity}</Text>
      <Text>Description: {description}</Text>
      <BorderedInput
        onChangeText={() => {}}
        value={'1234'}
        style={{ marginVertical: 10 }}
        placeholder='Ordering quantity'
        inputMode='numeric'
      />
      <Button
        title='Order'
        onPress={() => {
          router.back();
          router.back();
        }}
      />
    </ScrollView>
  );
};
