import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { NewLinkStatus } from '@/types/link';
import { LinkedSupplier, SupplierSearchParams } from '@/types/supplier';
import { GlobalContext } from '@/util/context';
import { callDelete, callPost } from '@/util/fetch';

export default function SupplierDetails() {
  const router = useRouter();
  const context = useContext(GlobalContext);
  const { id: sid = undefined! } = useLocalSearchParams<SupplierSearchParams>();
  const id = +sid;
  const index =
    context.linkedSupplierCache.current.findIndex(s => s.supplier.id == id);
  const { supplier: { company_name, address }, link } =
    context.linkedSupplierCache.current[index];
  const access = context.accessToken!;
  const [error, setError] = useState('');
  return (
    <ScrollView style={{ padding: 10 }}>
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <Text style={{ fontSize: 20 }}>Supplier name: {company_name}</Text>
      <Text>Current link status: {link?.status ?? 'NONE'}</Text>
      <Text>Address: {address}</Text>
      <View style={{ marginTop: 10 }}/>
      {
        link?.status == NewLinkStatus.Accepted ?
          <Button
            title='Terminate link'
            onPress={() => {
              callDelete(
                `/api/companies/links/${link!.id}/`,
                access,
                { supplier: id },
              )
              .then(result => {
                context.linkedSupplierCache.current[index].link = null;
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
              });
            }}
          />
        : link?.status == NewLinkStatus.Pending ?
          <Button
            title='Cancel link request'
            onPress={() => {
              callDelete(
                `/api/companies/links/${link!.id}/`,
                access,
                { supplier: id },
              )
              .then(result => {
                context.linkedSupplierCache.current[index].link = null;
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
              });
            }}
          />
        : link == null ?
          <Button
            title='Send link request'
            onPress={() => {
              callPost<{ id: number }>('/api/companies/links/', access, {
                supplier: id,
              }).then(result => {
                context.linkedSupplierCache.current[index].link = {
                  id: result.id,
                  supplier: context.linkedSupplierCache.current[index].supplier,
                  status: NewLinkStatus.Pending,
                  created_at: '-',
                };
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
              });
            }}
          />
        : link?.status == NewLinkStatus.Blocked ?
          <Text>You've been blocked by this supplier</Text>
        : <Text style={{ color: 'red' }}>ERROR: UNKNOWN LINK STATUS</Text>
      }
    </ScrollView>
  );
};
