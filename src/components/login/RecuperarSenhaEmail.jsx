import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";

export default function RecuperarSenhaEmail({setEtapa}) {

  function enviarEmail() {
    setEtapa(1);
  }

  return (
    <View style={{    alignItems: "center",
      justifyContent: "center",}}>
      <Text style={stylesTelaInicial.title}>Recuperar Senha</Text>
      <Text style={stylesTelaInicial.subtitle}>Digite seu email que vamos enviar um email de recuperação</Text>
    
      <InputText
        label="Email"
        placeholder="Digite seu email"
        styleContainer={{width: 350, marginTop: 20}}
      />
      <Button
        title={"Continuar"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={enviarEmail}
      />
    </View>
  );
}