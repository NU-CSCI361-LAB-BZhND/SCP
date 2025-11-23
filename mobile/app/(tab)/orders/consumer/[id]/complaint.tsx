import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Button, View } from 'react-native';
import BorderedInput from '@/components/borderedinput';
import { GlobalContext } from '@/util/context';
import { callPost } from '@/util/fetch';
import type { OrderSearchParams } from '@/types/order';

export default function ComplaintScreen() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const context = useContext(GlobalContext);
  const router = useRouter();
  const { id: sid = undefined! } = useLocalSearchParams<OrderSearchParams>();
  const id = +sid;
  return (
    <View style={{ padding: 10 }}>
      <BorderedInput
        style={{ margin: 5 }}
        onChangeText={setSubject}
        value={subject}
        placeholder='Subject'
        inputMode='text'
      />
      <BorderedInput
        style={{ margin: 5 }}
        onChangeText={setDescription}
        value={description}
        placeholder='Description'
        inputMode='text'
        multiline
      />
      <Button
        title='Send complaint'
        onPress={() => {
          callPost<{}>('/api/support/complaints/', context, {
            order_id: id,
            subject,
            description,
          }).then(result => {
            router.back();
            context.forceUpdate();
          }).catch(err => {
            router.back();
            context.forceUpdate();
          });
        }}
      />
    </View>
  );
}
