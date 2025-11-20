import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { SUPPLIERS } from '@/app/(tab)/links/index';
import OpacityPressable from '@/components/opacitypressable';
import type { ItemInfo } from '@/types/item';

function Item({ info }: { info: ItemInfo }) {
  const router = useRouter();
  const { id, supplier: sid, name, description, quantity } = info;
  const supplierName = SUPPLIERS.find(s => s.id == sid)!.name;
  return (
    <OpacityPressable
      onPress={() => router.push(`/orders/items/item/${sid}/${id}`)}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>{name}</Text>
      <Text selectable={false}>Quantity: {quantity}</Text>
      <Text selectable={false}>Supplier: {supplierName}</Text>
      <Text selectable={false}>{description}</Text>
    </OpacityPressable>
  );
}

export const ITEMS: ItemInfo[] = [
  {
    id: 1,
    supplier: 1,
    name: 'Product A',
    description: 'Product A description',
    quantity: 123,
  },
  {
    id: 2,
    supplier: 1,
    name: 'Product B',
    description: 'Product B description',
    quantity: 124,
  },
  {
    id: 1,
    supplier: 4,
    name: 'Product C',
    description: 'Product C description',
    quantity: 125,
  },
];

export default function Items() {
  return (
    <FlatList
      style={{ padding: 5 }}
      data={ITEMS}
      renderItem={({item}) => <Item info={item}/>}
      keyExtractor={item => `${item.id}-${item.supplier}`}
    />
  );
};
