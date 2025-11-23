import { Redirect, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { GlobalContext } from '@/util/context';
import { callGet } from '@/util/fetch';
import { OrderRead } from '@/types/order';

function SupplierOrder({ info }: { info: OrderRead }) {
  const router = useRouter();
  return (
    <OpacityPressable
      onPress={() => router.navigate(`/orders/supplier/${info.id}`)}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        Consumer: {info.consumer_name}
      </Text>
      <Text selectable={false}>Total amount: {info.total_amount}</Text>
      <Text selectable={false}>Status: {info.status}</Text>
    </OpacityPressable>
  );
}

function SupplierOrders() {
  const context = useContext(GlobalContext);
  const [orders, setOrders] = useState<OrderRead[]>([]);
  useEffect(() => {
    callGet<OrderRead[]>('/api/orders/', context).then(result => {
      setOrders(result);
    }).catch(err => {
      router.navigate('/login');
    });
  }, [context.accessToken, context.update]);
  const router = useRouter();
  return (
    <FlatList
      style={{ padding: 10 }}
      data={orders}
      renderItem={({item}) => <SupplierOrder info={item}/>}
      keyExtractor={item => String(item.id)}
    />
  );
}

function ConsumerOrder({ info }: { info: OrderRead }) {
  const router = useRouter();
  return (
    <OpacityPressable
      onPress={() => router.navigate(`/orders/consumer/${info.id}`)}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        Supplier: {info.supplier_name}
      </Text>
      <Text selectable={false}>Total amount: {info.total_amount}</Text>
      <Text selectable={false}>Status: {info.status}</Text>
    </OpacityPressable>
  );
}

function ConsumerOrders() {
  const context = useContext(GlobalContext);
  const [orders, setOrders] = useState<OrderRead[]>([]);
  useEffect(() => {
    callGet<OrderRead[]>('/api/orders/', context).then(result => {
      setOrders(result);
    }).catch(err => {
      router.navigate('/login');
    });
  }, [context.accessToken, context.update]);
  const router = useRouter();
  return (
    <View style={{ padding: 10 }}>
      <Button title='New order' onPress={() => router.navigate('/links')}/>
      <FlatList
        style={{ padding: 5 }}
        data={orders}
        renderItem={({item}) => <ConsumerOrder info={item}/>}
        keyExtractor={item => String(item.id)}
      />
    </View>
  );
}

export default function Orders() {
  const context = useContext(GlobalContext);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    callGet<{ role: string }>('/api/auth/me/', context).then(({ role }) => {
      setRole(role);
    }).catch(err => {
      setRole('');
    });
  }, [context.accessToken, context.update]);
  switch (role) {
    case 'SALES_REP': return <SupplierOrders/>;
    case 'CONSUMER': return <ConsumerOrders/>;
    case null: return <Text>LOADING</Text>;
    default: return <Redirect href='/login'/>;
  }
}
