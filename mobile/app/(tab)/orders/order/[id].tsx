import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SUPPLIERS } from '@/app/(tab)/links/index';
import { ORDERS } from '@/app/(tab)/orders/index';
import { ITEMS } from '@/app/(tab)/orders/items/index';
import type { OrderSearchParams } from '@/types/order';

export default function OrderDetails() {
  const { id: sid = undefined! } = useLocalSearchParams<OrderSearchParams>();
  const id = +sid;
  const order = ORDERS.find(order => order.id == id)!;
  const item =
    ITEMS.find(it => it.id == order.item && it.supplier == order.supplier)!;
  const supplier = SUPPLIERS.find(supplier => supplier.id == order.supplier)!;
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 20 }}>Item: {item.name}</Text>
      <Text>Description: {item.description}</Text>
      <View style={{ marginTop: 20 }}/>
      <Text style={{ fontSize: 20 }}>Supplier: {supplier.name}</Text>
      <Text>Description: {supplier.description}</Text>
      <View style={{ marginTop: 20 }}/>
      <Text>Order status: {order.status}</Text>
      <Text>Quantity: {order.quantity}</Text>
    </View>
  );
}
