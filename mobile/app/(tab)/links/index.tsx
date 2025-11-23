import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import OpacityPressable from '@/components/opacitypressable';
import { GlobalContext } from '@/util/context';
import { callGet } from '@/util/fetch';
import { LinkStatus } from '@/types/link';
import { LinkInfo } from '@/types/link';
import type { LinkedSupplier, SupplierCompany } from '@/types/supplier';

function ConsumerEntry({ info }: { info: LinkInfo }) {
  const router = useRouter();
  const { id, consumer, status } = info;
  return (
    <OpacityPressable
      onPress={() => router.push(`/links/link/${id}`)}
    >
      <Text selectable={false} style={{ fontSize: 20 }}>
        {consumer.company_name}
      </Text>
      <Text selectable={false}>Link status: {status}</Text>
      <Text selectable={false}>Address: {consumer.address}</Text>
    </OpacityPressable>
  );
}

function SupplierLinks() {
  const context = useContext(GlobalContext);
  const [links, setLinks] = useState<LinkInfo[]>([]);
  const router = useRouter();
  useEffect(() => {
    callGet<LinkInfo[]>('/api/companies/links/', context).then(result => {
      result.sort((a, b) => ( // Push BLOCKED ones to the end
        +(a.status == LinkStatus.Blocked) - +(b.status == LinkStatus.Blocked)
      ));
      setLinks(result);
    }).catch(err => {
      router.replace('/login');
    });
  }, [context.accessToken, context.update]);
  return (
    <FlatList
      style={{ padding: 5 }}
      data={links}
      renderItem={({item}) => <ConsumerEntry info={item}/>}
      keyExtractor={item => String(item.id)}
    />
  );
}


function SupplierEntry({ info }: { info: LinkedSupplier }) {
  const router = useRouter();
  const { supplier: { id, company_name, address }, link } = info;
  return (
    <OpacityPressable onPress={() => router.push(`/links/supplier/${id}`)}>
      <Text selectable={false} style={{ fontSize: 20 }}>{company_name}</Text>
      <Text selectable={false}>Link status: {link?.status ?? 'NONE'}</Text>
      <Text selectable={false}>Address: {address}</Text>
    </OpacityPressable>
  );
}

function ConsumerLinks() {
  const context = useContext(GlobalContext);
  const [suppliers, setSuppliers] = useState<SupplierCompany[]>([]);
  const [links, setLinks] = useState<LinkInfo[]>([]);
  const linkedSuppliers = useMemo(() => {
    const linked: LinkedSupplier[] =
      links.map(link => ({ supplier: link.supplier, link }));
    const ids = links.map(link => link.supplier.id);
    const unlinked: LinkedSupplier[] = suppliers
      .filter(s => ids.indexOf(s.id) < 0)
      .map(s => ({ supplier: s, link: null }));
    const linkedSuppliers = linked.concat(unlinked);
    context.linkedSupplierCache.current = linkedSuppliers;
    return linkedSuppliers;
  }, [suppliers, links]);
  const router = useRouter();
  useEffect(() => {
    callGet<SupplierCompany[]>('/api/companies/suppliers/', context)
      .then(result => {
        setSuppliers(result);
      }).catch(err => {
        router.replace('/login');
      });
    callGet<LinkInfo[]>('/api/companies/links/', context)
      .then(result => {
        setLinks(result);
      }).catch(err => {
        router.replace('/login');
      });
  }, [context.accessToken, context.update]);
  return (
    <FlatList
      style={{ padding: 5 }}
      data={linkedSuppliers}
      renderItem={({item}) => <SupplierEntry info={item}/>}
      keyExtractor={item => String(item.supplier.id)}
    />
  );
}

export default function Links() {
  const context = useContext(GlobalContext);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    callGet<{ role: string }>('/api/auth/me/', context).then(({ role }) => {
      setRole(role);
    }).catch(err => {
      setRole('');
    });
  }, [context.accessToken]);
  switch (role) {
    case 'SALES_REP': return <SupplierLinks/>;
    case 'CONSUMER': return <ConsumerLinks/>;
    case null: return <Text>LOADING</Text>;
    default: return <Redirect href='/login'/>;
  }
};
