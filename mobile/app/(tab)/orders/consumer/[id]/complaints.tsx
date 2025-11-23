import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { GlobalContext } from '@/util/context';
import { callGet } from '@/util/fetch';
import type { Complaint } from '@/types/complaint';
import type { OrderSearchParams } from '@/types/order';

function ComplaintPreview({ complaint }: { complaint: Complaint }) {
  return (
    <View
      style={{
        backgroundColor: '#e5e5e5',
        borderRadius: 10,
        padding: 10,
        margin: 5,
      }}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        Subject: {complaint.subject}
      </Text>
      <Text selectable={false}>Status: {complaint.status}</Text>
      <Text selectable={false}>Level: {complaint.escalation_level}</Text>
      <Text selectable={false}>At: {complaint.created_at}</Text>
      <Text selectable={false}>{complaint.description}</Text>
    </View>
  );
}

export default function OrderComplaints() {
  const context = useContext(GlobalContext);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const router = useRouter();
  const { id: sid = undefined! } = useLocalSearchParams<OrderSearchParams>();
  const id = +sid;
  useEffect(() => {
    callGet<Complaint[]>('/api/support/complaints/', context).then(result => {
      setComplaints(result.filter(c => c.order === id));
    }).catch(err => {
      router.back();
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  return (
    <FlatList
      style={{ padding: 5 }}
      data={complaints}
      renderItem={({item}) => <ComplaintPreview complaint={item}/>}
      keyExtractor={item => String(item.id)}
    />
  );
}
