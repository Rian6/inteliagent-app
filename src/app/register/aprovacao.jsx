import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  backgroudPrimary,
  white,
} from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/login/_style";
import Button from "@root/components/_default/button/Button";
import StepIndicator from "@root/components/_default/step_indicator/StepIndicator";
import useUserStore from "@root/context/userContext";

export default function Aprovacao() {
  const [currentStep, setCurrentStep] = useState(2);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false); 
  const [socket, setSocket] = useState(null);
  const { user, updateUser } = useUserStore();

  const stepsData = [
    {
      time: "08:00 AM",
      title: "Criar conta",
      description: "Seu perfil foi criado com sucesso!",
    },
    {
      time: "08:10 AM", 
      title: "Validar ID da sede",
      description: "Seu ID da sede foi validado com sucesso",
    },
    {
      time: "08:20 AM",
      title: "Confirmação do gestor",
      description: "Aguarde a confirmação de cadastro do gestor",
    },
  ];

  function goToInformacoesPessoais() {
    if (isApproved) {
      router.replace('register/informacoesPessoais');
    }
  }

  // Abrir conexão WebSocket e escutar mensagens do servidor
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.1.9:8080/aprove");

    ws.onopen = () => {
      console.log("Conexão WebSocket estabelecida");
      ws.send("{\"situacao\": \"request\", \"idCede\": "+user.idCede+"}"); // Enviar solicitação ao servidor
    };
 
    ws.onmessage = (event) => {
      const message = event.data;
      const aprovacao = JSON.parse(message)

      console.log(aprovacao.status)
      if(aprovacao.idCede == user.idCede){
        if (aprovacao.status.includes("aprovado")) {
          setCurrentStep(3); // Avançar para o próximo passo
          setIsApproved(true); // Atualizar estado de aprovação
        } else if (aprovacao.status.includes("rejeitado")) {
          setIsRejected(true); // Atualizar estado de rejeição
          setCurrentStep(2); // Avançar para o próximo passo
        }  
      }
    };

    ws.onclose = () => {
      console.log("Conexão WebSocket fechada");
    };

    setSocket(ws);

    return () => {
      ws.close(); // Fechar o WebSocket ao desmontar o componente
    };
  }, []);

  return (
    <View
      style={{ flex: 1, backgroundColor: backgroudPrimary, paddingTop: 50 }}
    >
      <View style={stylesTelaInicial.containerAprovacao}>
        <Text style={stylesTelaInicial.title}>Aprovação</Text>
        <Text style={stylesTelaInicial.subtitle}>
          {isRejected
            ? "Sua solicitação foi rejeitada. Entre em contato com o suporte."
            : "Sua solicitação está em processamento, entre em contato com seu gestor para que ele aprove a solicitação"}
        </Text>
      </View>

      <StepIndicator steps={stepsData} currentStep={currentStep} />

      <View
        style={{
          backgroundColor: backgroudPrimary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          title={"Continuar"}
          styleLabel={stylesTelaInicial.buttonNovaConta}
          styleText={{ color: white }}
          onPress={goToInformacoesPessoais}
          disabled={!isApproved} // Desativar até que seja aprovado
        />
      </View>
    </View>
  );
}
