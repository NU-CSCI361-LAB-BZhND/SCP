import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { GlobalContext } from '@/util/context';
import { callGet, callPost } from '@/util/fetch';
import type { Notification } from '@/types/notification';

function NotificationView({ notification }: { notification: Notification }) {
  const context = useContext(GlobalContext);
  return (
    <OpacityPressable
      onPress={() => {
        callPost<Notification>(
          `/api/notifications/${notification.id}/mark_read/`,
          context,
          { is_read: true }
        ).then(result => {
          context.forceUpdate();
        }).catch(err => {
          // IGNORED
          context.forceUpdate();
        });
      }}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        {notification.title}
      </Text>
      <Text selectable={false}>Type: {notification.type}</Text>
      <Text selectable={false}>From: {notification.created_at}</Text>
      <Text selectable={false}>{notification.message}</Text>
    </OpacityPressable>
  );
}

export default function Notifications() {
  const context = useContext(GlobalContext);
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    callGet<Notification[]>('/api/notifications/', context).then(result => {
      setNotifications(result.filter(n => !n.is_read));
    }).catch(err => {
      router.replace('/login');
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  return (
    <FlatList
      style={{ padding: 10 }}
      data={notifications}
      renderItem={({item}) => <NotificationView notification={item}/>}
      keyExtractor={item => String(item.id)}
    />
  );
}
