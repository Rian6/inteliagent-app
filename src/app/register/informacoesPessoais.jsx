import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import { black, primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import SocialMediaButton from "@root/components/_default/social_media_button/SocialMediaButton";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import useUserStore from "@root/context/userContext";

export default function InformacoesPessoais() {
  const { user, updateUser } = useUserStore();
  const updateCpf = (cpf) => updateUser({ cpf });
  const updateTelefone = (telefone) => updateUser({ telefone });

  function goToVerificacao() {
    router.replace("register/verificacao");
  }

  return (
    <View style={stylesTelaInicial.container}>
      <Text style={stylesTelaInicial.title}>Informações Pessoais</Text>
      <Text style={[stylesTelaInicial.subtitle, {fontSize: 18}]}>
        Bem Vindo <Text style={{ fontWeight: "bold"}}>{user.nome}</Text>
      </Text>
      <Text style={stylesTelaInicial.subtitle}>
        Estamos quase finalizando seu cadastro, mas para finalizar precisamos de só
        mais alguns dados pessoais seu.
      </Text>
      <InputText
        label="CPF"
        value={user.cpf}
        onChangeText={updateCpf}
        placeholder="Digite seu CPF"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Telefone"
        value={user.telefone}
        onChangeText={updateTelefone}
        placeholder="Digite seu numero de telefone"
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <Button
        title={"Continuar"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={goToVerificacao}
      />
    </View>
  );
}
