import { useContext } from 'react';
import { Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GlobalContext } from '@/util/context'

export default function Logout() {
  const context = useContext(GlobalContext);
  return (
    <Pressable
      onPress={() => {
        context.setAccessToken(null);
        context.setRefreshToken(null);
      }}
    >
    {({pressed}) => (
      <MaterialIcons
        style={{ opacity: pressed ? 0.5 : 1 }}
        name="logout"
        size={20}
      />
    )}
    </Pressable>
  );
}
