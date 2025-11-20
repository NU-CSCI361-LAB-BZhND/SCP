import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

export default function OpacityPressable(
  { onPress, children }: { onPress: () => void, children: ReactNode },
) {
  return (
    <Pressable onPress={onPress}>
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
        {children}
      </View>
    )}
    </Pressable>
  );
}
