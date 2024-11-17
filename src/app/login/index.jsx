import { Text, View, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import SocialMediaButton from "@root/components/_default/social_media_button/SocialMediaButton";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import React, { useState, useEffect } from "react";
import SnackBar from "@root/components/_default/snack-bar/SnackBar";
import { login } from "@root/service/usuario/usuarioService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { insertUsuario } from "@root/db/usuarioPersistence";
import { consumer } from "@root/db/_defaultPersistence";

export default function Login() {
  const params = useLocalSearchParams();

  const [visibleAlert, setVisibleAlert] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [isError, setIsError] = useState(false);
  const [messageAlert, setMessageAlert] = useState("Usuario cadastrado com sucesso!");

  useEffect(() => {
    setVisibleAlert(params && params.isRegisterUser);
  }, []);

  function goToRecoverPassword() {
    router.navigate("login/recoverPassword");
  }

  function goToRegister() {
    router.replace("register");
  }
 
  async function logar() {
    try {
      const response = await login({ email, senha });

      if (response.status == 200 && response.headers && response.headers.authorization) {
        const token = await AsyncStorage.getItem("token");
        const isNewUser = token==null;

        await AsyncStorage.setItem("token", response.headers.authorization);
        const usuarioInserido = await insertUsuario(response.data);
        if(usuarioInserido){
          await consumer(isNewUser);
          router.replace("tabs");
        }
      } else if (response.status == 401){
        exibirMensagemErro("Login Invalido");
      }
    } catch (error) {
      exibirMensagemErro("Erro ao fazer login, tente novamente mais tarde!");
      console.error("Erro ao fazer login:", error);
    }
  }

  function exibirMensagemErro(msg){
    setMessageAlert(msg);
    setIsError(true);
    setVisibleAlert(true);
  }

  function logarComGoogle() {}

  function logarComFacebook() {}

  return (
    <View style={stylesTelaInicial.container}>
      <Text style={stylesTelaInicial.title}>Login</Text>
      <Text style={stylesTelaInicial.subtitle}>
        Faça login com seu email e senha ou use sua conta do Google ou Facebook
      </Text>
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
      <Text style={stylesTelaInicial.textOu}>Ou</Text>
      <InputText
        label="Email"
        onChangeText={setEmail}
        value={email}
        placeholder="Digite seu email"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Senha"
        onChangeText={setSenha}
        value={senha}
        secureTextEntry
        placeholder="Digite sua senha"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <Button
        title={"Esqueci minha senha."}
        styleLabel={stylesTelaInicial.buttonEsqueciSenha}
        styleText={{ color: primaryColor }}
        onPress={goToRecoverPassword}
      />
      <Button
        title={"Login"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={logar}
      />
      <SnackBar
        message={messageAlert}
        visible={visibleAlert}
        isError
        onDismissCallBack={() => setVisibleAlert(false)}
      />
    </View>
  );
}
