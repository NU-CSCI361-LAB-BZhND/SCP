import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { GlobalContext } from '@/util/context';
import { callGet, callDelete } from '@/util/fetch';
import type { OrderItem, OrderRead, OrderSearchParams } from '@/types/order';

function Product({ info }: { info: OrderItem }) {
  return (
    <View
      style={{
        backgroundColor: '#e5e5e5',
        borderRadius: 10,
        padding: 10,
        margin: 5,
      }}
    >
      <Text style={{ fontSize: 20 }}>{info.product_name}</Text>
      <Text>Price at time of order: {info.price_at_time_of_order}</Text>
      <Text>Total price: {info.total_price}</Text>
      <Text>Quantity: {info.quantity} {info.product_unit}</Text>
    </View>
  );
}

export default function OrderDetails() {
  const { id: sid = undefined! } = useLocalSearchParams<OrderSearchParams>();
  const id = +sid;
  const context = useContext(GlobalContext);
  const router = useRouter();
  const [morder, setOrder] = useState<OrderRead | null>(null);
  useEffect(() => {
    callGet<OrderRead>(`/api/orders/${id}/`, context).then(result => {
      setOrder(result);
    }).catch(err => {
      router.back();
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  if (!morder) return <Text>LOADING</Text>;
  const order = morder!;
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 20 }}>Supplier: {order.supplier_name}</Text>
      <Text>Status: {order.status}</Text>
      <Text>Total amount: {order.total_amount}</Text>
      <FlatList
        style={{ marginBottom: 5 }}
        data={order.items}
        renderItem={({item}) => <Product info={item}/>}
        keyExtractor={item => String(item.id)}
      />
      <Button
        title='Remove order'
        onPress={() => {
          callDelete(`/api/orders/${id}/`, context).then(result => {
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
