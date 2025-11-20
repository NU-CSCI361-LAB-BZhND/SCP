import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ScrollView, Text, TextInput } from 'react-native';
import { ITEMS } from '@/app/(tab)/orders/items/index';
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
      <TextInput
        style={{
          marginVertical: 10,
          borderWidth: 1,
          borderColor: 'black',
          padding: 5,
        }}
        placeholder='Ordering quantity'
        placeholderTextColor='gray'
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
}
