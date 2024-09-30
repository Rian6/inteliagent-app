import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import Button from "@root/components/_default/button/Button";
import { primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/_style";

export default function App() {
  function goToLogin() {
    router.navigate("login");
  }

  function goToRegister() {
    router.navigate("register");
  }

  return (
    <View style={stylesTelaInicial.container}>
      <Image
        source={{
          uri: "https://www.ourofinosaudeanimal.com/media/old/uploads/blog/post/fotos/2014/20141031110116.jpg",
        }}
        width={300}
        height={500}
        style={stylesTelaInicial.image}
      />
      <Text style={stylesTelaInicial.title}>InteliAgent</Text>
      <Text style={stylesTelaInicial.subtitle}>
        Soluções rápidas para a sua rotina de combate a endemias.
      </Text>
      <Button
        title={"Criar nova conta"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={goToRegister}
      />
      <Button
        title={"Ja possui uma conta?"}
        styleLabel={stylesTelaInicial.buttonLogin}
        styleText={{ color: primaryColor }}
        onPress={goToLogin}
      />
    </View>
  );
}
