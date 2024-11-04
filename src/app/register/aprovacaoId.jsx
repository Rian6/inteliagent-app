import { Text, View, Image, Alert } from "react-native";
import { router } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import SocialMediaButton from "@root/components/_default/social_media_button/SocialMediaButton";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import StepIndicator from "@root/components/_default/step_indicator/StepIndicator";
import CodeInput from "@root/components/_default/code-input/CodeInput";
import useUserStore from "@root/context/userContext";
import { validateUsuariosCede } from "@root/service/cede/cedeService";

export default function AprovacaoId() {

  const { user, updateUser } = useUserStore();

  const updateIdCede = (idCede) => updateUser({ idCede });

  function validar(){
    validateUsuariosCede(user.idCede).then(res =>{
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        router.replace("./aprovacao");
        return;
      } 
      console.log(res)
      Alert.alert("Atenção","Id da cede não foi identificado na base de dados")
    });
  }

  return (
    <View style={stylesTelaInicial.container}>
      <Text style={stylesTelaInicial.title}>Confirmação da Cede</Text>
      <Image
        source={require('../../assets/images/encryption_banner.png')}
        width={100}
        height={100}
        style={stylesTelaInicial.image}
      />
      <Text style={stylesTelaInicial.subtitle}>Digite o ID da cede que foi compartilhado com você  para continuar com o cadastro</Text>
      <CodeInput
        onCodeFilled={updateIdCede}
        style={{ marginTop: 20 }}
        length={5}
      />
      <Button
        title={"Continuar"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={validar}
      />
    </View>
  );
}
