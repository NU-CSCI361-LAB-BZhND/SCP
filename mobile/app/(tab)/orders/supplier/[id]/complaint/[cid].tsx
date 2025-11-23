import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { GlobalContext } from '@/util/context';
import { callGet, callPatch, callPost } from '@/util/fetch';
import { ComplaintEscalationLevel, ComplaintStatus } from '@/types/complaint';
import type { Complaint } from '@/types/complaint';
import type { OrderSearchParams} from '@/types/order';

export default function ComplaintDetails() {
  const context = useContext(GlobalContext);
  const { cid: sid = undefined! } = useLocalSearchParams<{ cid?: string }>();
  const id = +sid;
  const [mcomplaint, setComplaint] = useState<Complaint | null>(null);
  const router = useRouter();
  useEffect(() => {
    callGet<Complaint>(`/api/support/complaints/${id}/`, context)
      .then(result => {
        setComplaint(result);
      })
      .catch(err => {
        router.back();
        context.forceUpdate();
      });
  }, [context.accessToken, context.update]);
  if (mcomplaint === null) return <Text>LOADING</Text>;
  const complaint = mcomplaint!;
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 20 }}>
        Subject: {complaint.subject}
      </Text>
      <Text>Status: {complaint.status}</Text>
      <Text>Level: {complaint.escalation_level}</Text>
      <Text>Created by: {complaint.created_by_email}</Text>
      <Text>At: {complaint.created_at}</Text>
      <Text>{complaint.description}</Text>
      <View style={{ marginTop: 10 }}/>
      {complaint.escalation_level == ComplaintEscalationLevel.SalesRep
        && complaint.status == ComplaintStatus.Open && (<>
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Start resolving complaint'
            onPress={() => {
              callPatch<{}>(`/api/support/complaints/${id}/`, context, {
                status: ComplaintStatus.InProgress,
                escalation_level: ComplaintEscalationLevel.SalesRep,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </>)}
      {complaint.escalation_level == ComplaintEscalationLevel.SalesRep
        && complaint.status == ComplaintStatus.InProgress && (<>
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Reolve complaint'
            onPress={() => {
              callPatch<{}>(`/api/support/complaints/${id}/`, context, {
                status: ComplaintStatus.Resolved,
                escalation_level: ComplaintEscalationLevel.SalesRep,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </>)}
      {complaint.escalation_level == ComplaintEscalationLevel.SalesRep
        && (complaint.status == ComplaintStatus.Open
          || complaint.status == ComplaintStatus.InProgress)
        && (<>
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Dismiss complaint'
            onPress={() => {
              callPatch<{}>(`/api/support/complaints/${id}/`, context, {
                status: ComplaintStatus.Dismissed,
                escalation_level: ComplaintEscalationLevel.SalesRep,
              }).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </>)}
      {complaint.escalation_level == ComplaintEscalationLevel.SalesRep
        && complaint.status == ComplaintStatus.InProgress && (<>
          <View style={{ marginTop: 10 }}/>
          <Button
            title='Escalate complaint'
            onPress={() => {
              callPost<Complaint>(
                `/api/support/complaints/${id}/escalate/`,
                context,
              ).then(result => {
                context.forceUpdate();
              }).catch(err => {
                router.back();
                context.forceUpdate();
              });
            }}
          />
        </>)}
    </View>
  );
}
