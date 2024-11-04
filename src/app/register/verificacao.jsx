import { Text, View } from "react-native";
import { primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import Button from "@root/components/_default/button/Button";
import CodeInput from "@root/components/_default/code-input/CodeInput";
import { cadastrarUsuario, enviaEmailValidacaoCodigo, validateRegisterUser } from "@root/service/usuario/usuarioService";
import { useEffect } from "react";
import useUserStore from "@root/context/userContext";
import { router } from "expo-router";

export default function Verificacao() {
  const { user, updateUser } = useUserStore();
  const updateCodigo = (codigoEmail) => updateUser({ codigoEmail });

  useEffect(()=>{
    enviarEmailValidacao();
  },[0])

  function enviarEmailValidacao(){
    enviaEmailValidacaoCodigo(user.email)
  }

  async function validar() {
    const response = await validateRegisterUser(user)
    console.log(response.status)
    if(response.status == 200){
      router.replace("./confirmaCadastroScreen");
    }
  }

  return (
    <View
      style={stylesTelaInicial.containerAprovacao}
    >
      <Text style={stylesTelaInicial.title}>Verificação</Text>
      <Text style={stylesTelaInicial.subtitle}>
        Enviamos um ccódigo para o email: {user.email}
      </Text>

      <CodeInput
        style={{ marginTop: 20 }}
        length={4}
        onCodeFilled={updateCodigo}
      />
      <View style={stylesTelaInicial.containerSubmit}>
        <Text style={stylesTelaInicial.subtitle}>Não recebeu o código?</Text>
        <Button
          title={"Enviar novamente"}
          styleLabel={stylesTelaInicial.buttonEnviarNovamente}
          styleText={{ color: primaryColor }}
          onPress={enviarEmailValidacao}
        />
      </View>
      <Button
        title={"Validar"}
        styleLabel={stylesTelaInicial.buttonEnviar}
        styleText={{ color: white }}
        onPress={validar}
      />
    </View>
  );
}
