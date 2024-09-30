import { Text, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { white } from "@root/components/_default/colors";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import { styles } from "@root/components/login/_style";

export default function NovaSenha() {
    const [etapa, setEtapa] = useState(0);

  function goToLogin() {
    router.navigate("login");
  }

  return (
    <View style={{    alignItems: "center",
      justifyContent: "center"}}>
      <Text style={styles.title}>Nova senha</Text>
      <Text style={styles.subtitle}>Digite sua nova senha</Text>
    
      <InputText
        label="Nova Senha"
        placeholder="Digite sua nova senha"
        styleContainer={{width: 350, marginTop: 20}}
      />
      <InputText
        label="Confirmar Senha"
        placeholder="Confirme sua nova senha"
        styleContainer={{width: 350, marginTop: 20}}
      />
      <Button
        title={"Criar Nova Senha"}
        styleLabel={styles.buttonEnviar}
        styleText={{ color: white }}
        onPress={goToLogin}
      />
    </View>
  );
}