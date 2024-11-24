import { Text, View } from "react-native";
import { stylesTelaInicial } from "@root/app/login/_style";
import Button from "@root/components/_default/button/Button";
import React, { useState } from "react";
import useUserStore from "@root/context/userContext";
import ProfilePicture from "@root/components/_default/profile-picture/ProfilePicture";
import { white } from "@root/components/_default/colors";
import InputText from "@root/components/_default/input/InputText";
import { uriToBase64 } from "@root/utils/imageUtil";
import { registrarUsuario } from "@root/service/usuario/usuarioService";
import { router } from "expo-router";

export default function ConfirmaCadastroScreen() {
  const { user, updateUser } = useUserStore();

  const updateImagePerfil = (imagemPerfilUsuario) =>
    updateUser({ imagemPerfilUsuario });

  async function onImageSelected(image) {
    const imageBase64 = await uriToBase64(image.uri);
    const imagemPerfilUsuario = {
      imageDataBase64: imageBase64,
      imageName: image.fileName,
      imageType: image.mimeType,
    };

    updateImagePerfil(imagemPerfilUsuario);
  }

  async function cadastrarUsuario() {
    const response = await registrarUsuario(user);
    if (response.status == 201) {
      router.replace({pathname:"login/index", params: { isRegisterUser: true }});
    }
  }

  return (
    <View style={stylesTelaInicial.containerConfirma}>
      <Text style={stylesTelaInicial.title}>Validar Informações</Text>
      <ProfilePicture onImageSelected={onImageSelected} />
      <InputText
        label="Nome"
        value={user.nome}
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Email"
        value={user.email}
        readOnly
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Local de Trabalho"
        value={user.nome}
        readOnly
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="CPF"
        value={user.cpf}
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <InputText
        label="Telefone"
        value={user.telefone}
        styleContainer={{ width: 350, marginTop: 20 }}
      />
      <Button
        title={"Finalizar"}
        styleLabel={stylesTelaInicial.buttonEnviar}
        styleText={{ color: white }}
        onPress={cadastrarUsuario}
      />
    </View>
  );
}
