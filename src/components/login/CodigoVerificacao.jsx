import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { primaryColor, white } from "@root/components/_default/colors";
import InputText from "@root/components/_default/input/InputText";
import Button from "@root/components/_default/button/Button";
import CodeInput from "@root/components/_default/code-input/CodeInput";
import { styles } from "@root/components/login/_style";

export default function CodigoVerificacao({setEtapa}) {
  const email = "rian._santos@hotmail.com";

  function handleCodePreenchido(code) {}
  function enviarCodigo(code) {}
  function validar(){
    setEtapa(2)
  }

  return (
    <View style={{    alignItems: "center",
      justifyContent: "center", padding: 10}}>
      <Text style={styles.title}>Verificação</Text>
      <Text style={styles.subtitle}>
        Enviamos um ccódigo para o email: {email}
      </Text>

      <CodeInput
        style={{ marginTop: 20 }}
        length={4}
        onCodeFilled={handleCodePreenchido}
      />
      <View style={styles.containerSubmit}>
        <Text style={styles.subtitle}>Não recebeu o código?</Text>
        <Button
          title={"Enviar novamente"}
          styleLabel={styles.buttonEnviarNovamente}
          styleText={{ color: primaryColor }}
          onPress={enviarCodigo}
        />
      </View>
      <Button
        title={"Validar"}
        styleLabel={styles.buttonValidar}
        styleText={{ color: white }}
        onPress={validar}
      />
    </View>
  );
}
