import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import BorderedInput from '@/components/borderedinput';
import { GlobalContext } from '@/util/context';
import { callGet, callPost } from '@/util/fetch';
import type { ChatSearchParams, Message } from '@/types/chat';

function MessageView({ message }: { message: Message }) {
  return (
    <View
      style={{
        backgroundColor: '#e5e5e5',
        borderRadius: 10,
        padding: 10,
        margin: 5,
      }}
    >
      <Text style={{ fontWeight: 'bold' }}>{message.sender_email}</Text>
      <Text style={{ fontSize: 12 }}>Sent: {message.created_at}</Text>
      <Text>{message.text}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { id: sid = undefined! } = useLocalSearchParams<ChatSearchParams>();
  const id = +sid;
  const context = useContext(GlobalContext);
  const [messages, setMesssages] = useState<Message[]>([]);
  const router = useRouter();
  const [text, setText] = useState('');
  useEffect(() => {
    callGet<Message[]>(`/api/support/chats/${id}/messages/`, context)
      .then(result => {
        setMesssages(result);
      })
      .catch(err => {
        router.back();
        context.forceUpdate();
      });
  }, [context.accessToken, context.update]);
  return (
    <KeyboardAvoidingView
      style={{ padding: 10, flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        style={{ flex: 1, padding: 5 }}
        data={messages}
        renderItem={({item}) => <MessageView message={item}/>}
        keyExtractor={item => String(item.id)}
      />
      <View style={{ flexDirection: 'row' }}>
        <BorderedInput
          style={{ flex: 1 }}
          onChangeText={setText}
          value={text}
          placeholder='Enter message'
          inputMode='text'
        />
        <Pressable
          onPress={() => {
            if (text.trim() === '') return;
            callPost<Message>(`/api/support/chats/${id}/messages/`, context, {
              text,
              file: null,
            }).then(result => {
              setText('');
              context.forceUpdate();
            }).catch(err => {
              router.back();
              context.forceUpdate();
            });
          }}
        >
        {({ pressed }) => (
          <MaterialIcons
            style={{ margin: 10, opacity: pressed ? 0.5 : 1 }}
            name="send"
            size={20}
          />
        )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
