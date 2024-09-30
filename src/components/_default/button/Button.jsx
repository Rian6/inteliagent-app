import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { black, white } from "@root/components/_default/colors";

export default function Button(props) {
  return (
    <Pressable
      style={Object.assign(
        {
          borderRadius: 50,
          backgroundColor: props.styleLabel.backgroudColor,
          shadowColor: black,
          elevation: props && props.isButton ? 10 : 0,
          alignItems: "center",
          justifyContent: "center",
        },
        props && props.styleLabel ? props.styleLabel : {}
      )}
      onPress={props && props.onPress ? props.onPress : () => {}}
    >
      
      <Text
        style={Object.assign(
          {fontWeight: 700},
          props && props.styleText ? props.styleText : {}
        )}
      >
        {props.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
    justifyContent: "center",
  },
});
