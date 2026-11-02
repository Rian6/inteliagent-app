import * as React from "react";
import { Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou de react-native-vector-icons
import { sucessColor, white, errorColor } from "@root/components/_default/colors";
import { View } from 'react-native';

export default function SnackBar({ message, visible, onDismissCallBack, isError }) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismissCallBack}
      theme={{
        colors: { inverseSurface: !isError ? sucessColor : errorColor, inverseOnSurface: white },
        isV3: true,
      }}
      onIconPress={onDismissCallBack}
      icon={() => (
        <MaterialCommunityIcons name="close" size={24} color={white} />
      )}
      duration={Snackbar.DURATION_SHORT}
    >
      <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 8, alignItems: 'center' }}>
        <MaterialCommunityIcons name={isError ? "alert-circle" : "check-circle"} size={24} color={white} />
        <Text style={{ color: white, flexShrink: 1 }}>{message}</Text>
      </View>
    </Snackbar>
  );
}
