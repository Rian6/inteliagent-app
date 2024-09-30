import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import SocialMediaButton from "@root/components/_default/social_media_button/SocialMediaButton";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";

export default function Login() {
  function logar() {
    router.reset({
      index: 0,
      routes: [{ name: "tabs" }], // Altere para o caminho desejado
    });
  }

  function goToRecoverPassword() {
    router.navigate("login/recoverPassword");
  }

  function goToRegister() {
    router.replace("register");
  }

  function logarComGoogle() {}

  function logarComFacebook() {}

  return (
    <View style={stylesTelaInicial.container}>
      <Text style={stylesTelaInicial.title}>Criar nova conta</Text>
      <Text style={stylesTelaInicial.subtitle}>Comece criando sua conta</Text>
      <InputText
        label="Nome"
        placeholder="Digite seu nome"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Email"
        placeholder="Digite seu email"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Senha"
        placeholder="Digite sua senha"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Senha"
        placeholder="Confirme sua senha"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <Button
        title={"Criar nova conta"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={logar}
      />
      <Text style={stylesTelaInicial.textOu}>Ou use outro método</Text>
      <SocialMediaButton
        title={"Logar com Facebook"}
        logo={require("../../assets/icons/social/facebook-icon.png")}
        styleLabel={stylesTelaInicial.buttonSocial}
        styleText={{ color: black }}
        onPress={logarComFacebook}
      />
      <SocialMediaButton
        title={"Logar com Google"}
        logo={require("../../assets/icons/social/google-icon.png")}
        styleLabel={stylesTelaInicial.buttonSocial}
        styleText={{ color: black }}
        onPress={logarComGoogle}
      />
    </View>
  );
}
