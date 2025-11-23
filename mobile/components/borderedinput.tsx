import { TextInput } from 'react-native';

export default function BorderedInput(
  {
    onChangeText,
    value,
    placeholder,
    inputMode,
    multiline = false,
    style = {},
  }: {
    onChangeText: (text: string) => void;
    value: string;
    placeholder: string;
    inputMode: 'numeric' | 'email' | 'text' | 'password';
    multiline?: boolean;
    style?: object;
  },
) {
  let secureTextEntry = false;
  if (inputMode == 'password') {
    secureTextEntry = true;
    inputMode = 'text';
  }
  return (
    <TextInput
      style={{
        borderWidth: 1,
        borderColor: 'black',
        padding: 5,
        ...style,
      }}
      onChangeText={onChangeText}
      value={value}
      placeholder={placeholder}
      placeholderTextColor='gray'
      inputMode={inputMode}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
    />
  );
};
