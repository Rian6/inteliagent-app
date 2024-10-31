import * as React from "react";
import { Snackbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou de react-native-vector-icons
import { sucessColor, white, errorColor } from "@root/components/_default/colors";
import { Text, View } from "react-native";

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
      <View style={{ flexDirection: "row" }}>
        <MaterialCommunityIcons name="close-circle" size={24} color={white} />
        <Text style={{ color: white }}>{"  " + message}</Text>
      </View>
    </Snackbar>
  );
}
