import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { GlobalContext } from '@/util/context';
import { callGet, callDelete, callPatch } from '@/util/fetch';
import { OrderStatus } from '@/types/order';
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
  const [error, setError] = useState('');
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
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <Text style={{ fontSize: 20 }}>Supplier: {order.supplier_name}</Text>
      <Text>Status: {order.status}</Text>
      <Text>Total amount: {order.total_amount}</Text>
      <FlatList
        style={{ marginBottom: 5 }}
        data={order.items}
        renderItem={({item}) => <Product info={item}/>}
        keyExtractor={item => String(item.id)}
      />
      {
        order.status == OrderStatus.Pending ? <>
          <Button
            title='Confirm order'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Confirmed,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
                context.forceUpdate();
              });
            }}
          />
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Decline order'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Declined,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </> : order.status == OrderStatus.Confirmed ? <>
          <Button
            title='Ship order'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Shipped,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Cancel order'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Cancelled,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </> : order.status == OrderStatus.Shipped ? <>
          <Button
            title='Deliver order'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Delivered,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Revert order shipment'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Confirmed,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </> : order.status == OrderStatus.Delivered ? <>
          <Button
            title='Revert order delivery'
            onPress={() => {
              callPatch<{}>(`/api/orders/${id}/`, context, {
                status: OrderStatus.Shipped,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
          <View style={{ marginTop: 10 }}/>
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
        </> : order.status == OrderStatus.Cancelled ? <>
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
        </> : order.status == OrderStatus.Declined ? <>
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
        </> : <Text style={{ color: 'red' }}>ERROR: UKNOWN ORDER STATUS</Text>
      }
      <View style={{ marginTop: 10 }}/>
      <Button
        title='View complaints'
        onPress={() => router.navigate(`/orders/supplier/${id}/complaints`)}
      />
    </View>
  );
}
