import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, ScrollView, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { LinkStatus } from '@/types/link';
import type { IndexSearchParams } from '@/types/index';
import type { SupplierInfo } from '@/types/supplier';

function SupplierLinks() {
  return (
    <View>
      <Text>THIS IS SUPPLIER</Text>
    </View>
  );
}

function SupplierEntry({ info }: { info: SupplierInfo }) {
  const router = useRouter();
  const { id, name, description, status } = info;
  return (
    <OpacityPressable onPress={() => router.push(`/links/supplier/${id}`)}>
      <Text selectable={false} style={{ fontSize: 20 }}>{name}</Text>
      <Text selectable={false} style={{ flexShrink: 0 }}>
        Link status: {status}
      </Text>
      <Text selectable={false}>{description}</Text>
    </OpacityPressable>
  );
}

export const SUPPLIERS: SupplierInfo[] = [
  {
    id: 1,
    name: 'Supplier A Supplier A Supplier A Supplier A',
    description: 'Description A',
    status: LinkStatus.Approved,
  },
  {
    id: 2,
    name: 'Supplier B',
    description: 'Description B',
    status: LinkStatus.Pending,
  },
  {
    id: 3,
    name: 'Supplier C',
    description: 'Description C',
    status: LinkStatus.None,
  },
  {
    id: 4,
    name: 'Supplier D',
    description: 'Description D',
    status: LinkStatus.Approved,
  },
];

function ConsumerLinks() {
  return (
    <FlatList
      style={{ padding: 5 }}
      data={SUPPLIERS}
      renderItem={({item}) => <SupplierEntry info={item}/>}
      keyExtractor={item => String(item.id)}
    />
  );
}

export default function Links() {
  const { as } = useLocalSearchParams<IndexSearchParams>();
  switch (as) {
    case 'supplier': return <SupplierLinks/>;
    case 'consumer': return <ConsumerLinks/>;
    default: return <Redirect href='/login'/>;
  }
};
