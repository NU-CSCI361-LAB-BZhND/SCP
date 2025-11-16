import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { LinkStatus } from '@/types/link';
import type { IndexSearchParams } from '@/types/index';
import type { SupplierInfo } from '@/types/supplier';

function SupplierIndex() {
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
    <Pressable onPress={() => router.push(`/links/supplier/${id}`)}>
      {({pressed}) => (
        <View
          style={{
            backgroundColor: '#e5e5e5',
            borderRadius: 10,
            padding: 10,
            opacity: pressed ? 0.5 : 1,
            margin: 5,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text selectable={false} style={{ fontSize: 20 }}>{name}</Text>
            <Text selectable={false} style={{ flexShrink: 0 }}>
              Link status: {status}
            </Text>
          </View>
          <Text selectable={false}>{description}</Text>
        </View>
      )}
    </Pressable>
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
];

function ConsumerIndex() {
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
    case 'supplier': return <SupplierIndex/>;
    case 'consumer': return <ConsumerIndex/>;
    default: return <Redirect href='/login'/>;
  }
};
