import { useRouter } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { GlobalContext } from '@/util/context';
import { callGet, callPost } from '@/util/fetch';
import type { Chat } from '@/types/chat';
import type { LinkInfo } from '@/types/link';

function Link({ info, supplier }: { info: LinkInfo, supplier: boolean }) {
  const context = useContext(GlobalContext);
  const router = useRouter();
  return (
    <OpacityPressable
      onPress={() => {
        callPost<Chat>('/api/support/chats/', context, {
          supplier: info.supplier.id,
          consumer: info.consumer.id,
        }).then(result => {
          router.back();
          context.forceUpdate();
        }).catch(err => {
          router.back();
          context.forceUpdate();
        });
      }}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        {supplier ? info.consumer.company_name : info.supplier.company_name}
      </Text>
    </OpacityPressable>
  );
}

export default function NewChat() {
  const context = useContext(GlobalContext);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [links, setLinks] = useState<LinkInfo[]>([]);
  useEffect(() => {
    callGet<{ role: string }>('/api/auth/me/', context)
      .then(({ role }) => {
        setRole(role);
      })
      .catch(err => {
        router.back();
        context.forceUpdate();
      });
  }, [context.accessToken]);
  useEffect(() => {
    callGet<Chat[]>('/api/support/chats/', context).then(result => {
      setChats(result);
      callGet<LinkInfo[]>('/api/companies/links/', context)
        .then(result => {
          setLinks(result);
        }).catch(err => {
          router.back();
          context.forceUpdate();
        });
    }).catch(err => {
      router.back();
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  const supplier = role === 'SALES_REP';
  const filteredLinks = useMemo(() => links.filter(l => (
    chats
      .map(c => supplier ? c.consumer : c.supplier)
      .indexOf(supplier ? l.consumer.id : l.supplier.id)
    < 0
  )), [chats, links]);
  if (role === null) return <Text>LOADING</Text>;
  return (
    <FlatList
      style={{ padding: 5 }}
      data={filteredLinks}
      renderItem={({item}) => <Link info={item} supplier={supplier}/>}
      keyExtractor={item => String(item.supplier.id)}
    />
  );
}
