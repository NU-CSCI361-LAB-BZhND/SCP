import { Text, View } from 'react-native';

export default function Items() {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>items</Text>
    </View>
  );
};
