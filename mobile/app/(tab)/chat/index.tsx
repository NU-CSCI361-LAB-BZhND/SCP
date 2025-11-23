import { Redirect, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { GlobalContext } from '@/util/context';
import { callGet } from '@/util/fetch';
import type { Chat } from '@/types/chat';

function ChatPreview({ chat, supplier }: { chat: Chat, supplier: boolean }) {
  const router = useRouter();
  return (
    <OpacityPressable onPress={() => router.navigate(`/chat/chat/${chat.id}`)}>
      <Text selectable={false} style={{ fontSize: 20 }}>
        {supplier ? chat.consumer_name : chat.supplier_name}
      </Text>
      { chat.last_message !== null &&
        <Text selectable={false}>Last: {chat.last_message!.created_at}</Text>}
      { chat.last_message !== null &&
        <Text selectable={false}>{chat.last_message.text}</Text>}
    </OpacityPressable>
  );
}

export default function Chats() {
  const context = useContext(GlobalContext);
  const [role, setRole] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const router = useRouter();
  useEffect(() => {
    callGet<{ role: string }>('/api/auth/me/', context).then(({ role }) => {
      setRole(role);
    }).catch(err => {
      setRole('');
    });
  }, [context.accessToken]);
  useEffect(() => {
    callGet<Chat[]>('/api/support/chats/', context).then(result => {
      setChats(result);
    }).catch(err => {
      setRole('');
    });
  }, [context.accessToken, context.update]);
  if (role !== 'SALES_REP' && role !== 'CONSUMER' && role !== null) {
    return <Redirect href='/login'/>;
  }
  if (!role) return <Text>Loading</Text>;
  return (
    <View style={{ padding: 10 }}>
      <Button title='New chat' onPress={() => router.navigate('/chat/new')}/>
      <View style={{ marginTop: 5 }}/>
      <FlatList
        style={{ padding: 5 }}
        data={chats}
        renderItem={({item}) => (
          <ChatPreview chat={item} supplier={role == 'SALES_REP'}/>
        )}
        keyExtractor={item => String(item.id)}
      />
    </View>
  );
};
