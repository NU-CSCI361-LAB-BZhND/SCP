import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { GlobalContext } from '@/util/context';
import { callDelete, callGet, callPatch } from '@/util/fetch';
import { LinkStatus } from '@/types/link';
import type { ConsumerSearchParams } from '@/types/consumer';
import type { LinkInfo } from '@/types/link';

export default function SupplierDetails() {
  const router = useRouter();
  const context = useContext(GlobalContext);
  const { id: sid = undefined! } = useLocalSearchParams<ConsumerSearchParams>();
  const id = +sid;
  const [error, setError] = useState('');
  const [minfo, setInfo] = useState<LinkInfo | null>(null);
  useEffect(() => {
    callGet<LinkInfo>(`/api/companies/links/${id}/`, context).then(result => {
      setInfo(result);
    }).catch(err => {
      router.back();
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  if (minfo === null) return <Text>LOADING</Text>;
  const info = minfo!;
  return (
    <ScrollView style={{ padding: 10 }}>
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <Text style={{ fontSize: 20 }}>
        Consumer name: {info.consumer.company_name}
      </Text>
      <Text>Current link status: {info.status}</Text>
      <Text>Address: {info.consumer.address}</Text>
      <View style={{ marginTop: 10 }}/>
      {
        info.status == LinkStatus.Pending ?
          <>
            <Button
              title='Accept link request'
              onPress={() => {
                callPatch<LinkInfo>(
                  `/api/companies/links/${info.id}/`,
                  context,
                  { status: LinkStatus.Accepted },
                )
                .then(result => {
                  setInfo(result);
                  context.forceUpdate();
                }).catch(err => {
                  setError(String(err));
                });
              }}
            />
            <View style={{ marginTop: 10 }}/>
            <Button
              title='Block'
              color='red'
              onPress={() => {
                callPatch<LinkInfo>(
                  `/api/companies/links/${info.id}/`,
                  context,
                  { status: LinkStatus.Blocked },
                )
                .then(result => {
                  setInfo(result);
                  context.forceUpdate();
                }).catch(err => {
                  setError(String(err));
                });
              }}
            />
          </>
        : info.status == LinkStatus.Accepted ?
          <Button
            title='Remove link'
            color='red'
            onPress={() => {
              callDelete(
                `/api/companies/links/${info.id}/`,
                context,
              )
              .then(result => {
                router.back();
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
              });
            }}
          />
        : info.status == LinkStatus.Blocked ?
          <Button
            title='Unblock'
            onPress={() => {
              callDelete(
                `/api/companies/links/${info.id}/`,
                context,
              )
              .then(result => {
                router.back();
                context.forceUpdate();
              }).catch(err => {
                setError(String(err));
              });
            }}
          />
        : <Text style={{ color: 'red' }}>ERROR: UNKNOWN LINK STATUS</Text>
      }
    </ScrollView>
  );
}
