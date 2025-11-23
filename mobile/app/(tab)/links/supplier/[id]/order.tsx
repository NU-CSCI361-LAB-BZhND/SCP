import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  Button, FlatList, KeyboardAvoidingView, Platform, Text, View,
} from 'react-native';
import BorderedInput from '@/components/borderedinput';
import { GlobalContext } from '@/util/context';
import { callGet, callPost } from '@/util/fetch';
import type { OrderRead } from '@/types/order';
import type { OrderProduct, ProductInfo } from '@/types/product';
import type { SupplierSearchParams } from '@/types/supplier';

function Product({ info }: { info: OrderProduct }) {
  const [stringValue, setStringValue] = useState('0');
  return (
    <View
      style={{
        backgroundColor: '#e5e5e5',
        borderRadius: 10,
        padding: 10,
        margin: 5,
      }}
    >
      <Text style={{ fontSize: 20 }}>{info.product.name}</Text>
      <Text>Description: {info.product.description}</Text>
      <Text>Price: {info.product.price}</Text>
      <Text>Stock level: {info.product.stock_level} {info.product.unit}</Text>
      <BorderedInput
        style={{
          marginTop: 5,
          color: info.amount == parseInt(stringValue) ? undefined : 'red',
        }}
        onChangeText={value => {
          setStringValue(value);
          const parsed = parseInt(value);
          if (parsed >= 0 && parsed <= info.product.stock_level) {
            info.setAmount(parsed);
          } else if (!value) {
            info.setAmount(0);
          } else {
            info.setAmount(null);
          }
        }}
        value={stringValue}
        placeholder='Ordering amount'
        inputMode='numeric'
      />
    </View>
  );
}

export default function NewOrder() {
  const context = useContext(GlobalContext);
  const { id: sid = undefined! } = useLocalSearchParams<SupplierSearchParams>();
  const id = +sid;
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const router = useRouter();
  useEffect(() => {
    callGet<ProductInfo[]>('/api/products/', context).then(result => {
      const filtered = result.filter(p => p.supplier == id);
      const ps: OrderProduct[] = result.map((p, i) => ({
        product: p,
        amount: 0,
        setAmount: n => {
          const arr = [...ps];
          arr[i].amount = n;
          setProducts(arr);
        },
      }));
      setProducts(ps);
    }).catch(err => {
      router.back();
      router.back();
      context.forceUpdate();
    });
  }, [context.accessToken, context.update]);
  const [error, setError] = useState('');
  return (
    <KeyboardAvoidingView
      style={{ padding: 10 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <Button
        title='Order'
        onPress={() => {
          if (products.some(p => p.amount == null)
            || products.every(p => p.amount == 0)) return;
          callPost<OrderRead>('/api/orders/', context, {
            supplier: id,
            items: products.map(p => ({
              product_id: p.product.id,
              quantity: p.amount,
            })),
          }).then(result => {
            router.back();
            router.back();
            router.navigate('/orders');
          }).catch(err => {
            setError(String(err));
          });
        }}
      />
      <View style={{ marginTop: 10 }}/>
      <FlatList
        data={products}
        renderItem={({item}) => <Product info={item}/>}
        keyExtractor={item => String(item.product.id)}
      />
    </KeyboardAvoidingView>
  );
};
