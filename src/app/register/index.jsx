import { Text, View, ScrollView } from "react-native";
import { router } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import SocialMediaButton from "@root/components/_default/social_media_button/SocialMediaButton";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import useUserStore from "@root/app/register/context/userContext";
import { useState } from "react";
import { validateRegisterUser } from "@root/service/usuario/usuarioService";

export default function Login() {
  const { user, updateUser } = useUserStore();
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const updateName = (nome) => updateUser({ nome });
  const updateEmail = (email) => updateUser({ email });
  const updatePassword = (senha) => updateUser({ senha });

  async function goToAprovacao() {
    if (!user.nome || !user.email || !user.senha || !confirmarSenha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (user.senha != confirmarSenha) {
      alert("A senha digitada não é igual a confirmação da senha.");
      return;
    }

    //response = await validateUser();

    router.replace('./aprovacaoId');
  }

  async function validateUser(user){
      return validateRegisterUser(user)
  }

  function logarComGoogle() {
    // Implementar lógica para login com Google
  }

  function logarComFacebook() {
    // Implementar lógica para login com Facebook
  }

  return (
    <ScrollView bounces={false} style={stylesTelaInicial.containerScroll}>
      <View style={stylesTelaInicial.container}>
        <Text style={stylesTelaInicial.title}>Criar nova conta</Text>
        <Text style={stylesTelaInicial.subtitle}>Comece criando sua conta</Text>
        
        <InputText
          label="Nome"
          placeholder="Digite seu nome"
          value={user.nome}
          onChangeText={updateName}
          styleContainer={{ width: 350, marginTop: 20 }}
        />
        
        <InputText
          label="Email"
          placeholder="Digite seu email"
          value={user.email}
          onChangeText={updateEmail}
          styleContainer={{ width: 350, marginTop: 20 }}
        />
        
        <InputText
          label="Senha"
          placeholder="Digite sua senha"
          value={user.senha}
          secureTextEntry
          onChangeText={updatePassword}
          styleContainer={{ width: 350, marginTop: 20 }}
        />
        
        <InputText
          label="Confirme sua senha"
          placeholder="Confirme sua senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={(text)=> setConfirmarSenha(text)}
          styleContainer={{ width: 350, marginTop: 20 }}
        />
        
        <Button
          title={"Criar nova conta"}
          styleLabel={stylesTelaInicial.buttonNovaConta}
          styleText={{ color: white }}
          onPress={goToAprovacao}
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
    </ScrollView>
  );
}
