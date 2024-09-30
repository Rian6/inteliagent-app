import { black, white } from "@root/components/_default/colors";
import { Pressable, StyleSheet, Text, Image } from "react-native";

export default function SocialMediaButton(props) {
  return (
    <Pressable
      style={Object.assign(
        {
          borderRadius: 5,
          backgroundColor: props.styleLabel.backgroudColor,
          shadowColor: black,
          elevation: (props && props.isButton ? 20 : 5),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between', // Alinha os itens nas extremidades
          paddingHorizontal: 10, // Adiciona um pouco de padding horizontal
        },
        props && props.styleLabel ? props.styleLabel : {}
      )}
      onPress={props && props.onPress ? props.onPress : () => {}}
    >
      <Image
        source={props.logo}
        style={{ marginHorizontal: 10, width: 20, height: 20 }}
      />
      <Text
        style={[
          { fontWeight: '700', flex: 1, textAlign: 'left' }, // Alinha o texto à esquerda
          props && props.styleText ? props.styleText : {}
        ]}
      >
        {props.title}
      </Text>
      <Image
        source={require('../../../assets/icons/row-rigth.png')}
        style={{ width: 20, height: 20 }}
      />
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
