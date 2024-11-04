import { backgroudPrimary, textBlackColor, textPrimaryColor } from '@root/components/_default/colors';
import * as React from 'react';
import { TextInput } from 'react-native-paper';

const InputTextForm = ({ label, value, onChangeText, style, ...rest }) => {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode='outlined'
      textColor={textBlackColor}
      style={[{height: 56, margin: 0, backgroundColor: backgroudPrimary}, style]}
      activeOutlineColor={textPrimaryColor}
      {...rest}
    />
  );
};

export default InputTextForm;
