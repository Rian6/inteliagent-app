import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import RecuperarSenhaEmail from "@root/components/login/RecuperarSenhaEmail";
import CodigoVerificacao from "@root/components/login/CodigoVerificacao";
import NovaSenha from "@root/components/login/NovaSenha";
import { styles } from "@root/components/login/_style";

export default function RecoverPassword() {
  const [etapa, setEtapa] = useState(0);

  return (
    <View style={styles.container}>
      {etapa == 0 ? (
        <RecuperarSenhaEmail setEtapa={setEtapa} />
      ) : etapa == 1 ? (
        <CodigoVerificacao setEtapa={setEtapa} />
      ) : (
        <NovaSenha />
      )}
    </View>
  );
}
