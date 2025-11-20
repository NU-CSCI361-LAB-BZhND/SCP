import { useRouter } from 'expo-router';
import { Button, FlatList, Text, View } from 'react-native';
import { ITEMS } from '@/app/(tab)/orders/items/index';
import { SUPPLIERS } from '@/app/(tab)/links/index';
import OpacityPressable from '@/components/opacitypressable';
import { OrderStatus } from '@/types/order';
import type { OrderInfo } from '@/types/order';

function Order({ info }: { info: OrderInfo }) {
  const router = useRouter();
  const item =
    ITEMS.find(item => item.id == info.item && item.supplier == info.supplier)!;
  const supplier = SUPPLIERS.find(s => s.id == info.supplier)!;
  return (
    <OpacityPressable onPress={() => router.push(`/orders/order/${info.id}`)}>
      <Text selectable={false} style={{ fontSize: 20 }}>{item.name}</Text>
      <Text selectable={false}>Supplier: {supplier.name}</Text>
      <Text selectable={false}>Quantity: {info.quantity}</Text>
      <Text selectable={false}>Status: {info.status}</Text>
    </OpacityPressable>
  );
}

export const ORDERS: OrderInfo[] = [
  {
    id: 1,
    supplier: 1,
    item: 1,
    quantity: 10,
    status: OrderStatus.Pending,
  },
  {
    id: 2,
    supplier: 1,
    item: 2,
    quantity: 20,
    status: OrderStatus.Sent,
  },
  {
    id: 3,
    supplier: 4,
    item: 1,
    quantity: 30,
    status: OrderStatus.Declined,
  },
];

export default function Orders() {
  const router = useRouter();
  return (
    <View style={{ padding: 10 }}>
      <Button title='New order' onPress={() => router.push('/orders/items')}/>
      <FlatList
        style={{ padding: 5 }}
        data={ORDERS}
        renderItem={({item}) => <Order info={item}/>}
        keyExtractor={item => `${item.id}-${item.supplier}`}
      />
    </View>
  );
}
