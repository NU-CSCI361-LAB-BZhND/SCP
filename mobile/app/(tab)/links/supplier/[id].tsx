import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ScrollView, Text, View } from 'react-native';
import { SUPPLIERS } from '@/app/(tab)/links/index';
import { LinkStatus } from '@/types/link';
import { SupplierSearchParams } from '@/types/supplier';

export default function SupplierDetails() {
  const router = useRouter();
  const { id: sid = undefined! } = useLocalSearchParams<SupplierSearchParams>();
  const id = +sid;
  const { name, description, status } = SUPPLIERS.find(item => item.id == id)!;
  return (
    <ScrollView style={{ padding: 10 }}>
      <Text style={{ fontSize: 20 }}>Supplier name: {name}</Text>
      <Text>Current link status: {status}</Text>
      <Text>Description: {description}</Text>
      <View style={{ marginTop: 10 }}/>
      {
        status == LinkStatus.Approved ?
          <Button title='Terminate link' onPress={() => {}}/>
        : status == LinkStatus.Pending ?
          <Button title='Cancel link request' onPress={() => {}}/>
        : status == LinkStatus.None ?
          <Button title='Send link request' onPress={() => {}}/>
        : <Text>ERROR: UNKNOWN LINK STATUS</Text>
      }
    </ScrollView>
  );
};
