import { useState } from "react";
import { router, Redirect } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import {
  Button,
  Field,
  ErrorText,
  Text,
  Disclosure,
} from "@root/components/ui";
import useUserStore from "@root/context/userContext";
import ProfilePicture from "@root/components/_default/profile-picture/ProfilePicture";
import { uriToBase64 } from "@root/utils/imageUtil";
import { registrarUsuario } from "@root/service/usuario/usuarioService";
export default function Confirm() {
  const { user, updateUser } = useUserStore();
  const verifiedEmail = useUserStore((state) => state.verifiedEmail);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!user.codigoEmail || !user.idCede || verifiedEmail !== user.email)
    return <Redirect href="/register" />;
  async function photo(image) {
    try {
      const imageDataBase64 = await uriToBase64(image.uri);
      updateUser({
        imagemPerfilUsuario: {
          imageDataBase64,
          imageName: image.fileName,
          imageType: image.mimeType,
        },
      });
    } catch {
      setError("Não foi possível abrir a foto. Escolha outra imagem.");
    }
  }
  async function submit() {
    if (busy) return;
    if (!String(user.nome || "").trim()) {
      setError("Informe seu nome.");
      return;
    }
    const cpf = String(user.cpf || "").replace(/\D/g, "");
    const phone = String(user.telefone || "").replace(/\D/g, "");
    if (cpf && cpf.length !== 11) {
      setError("Confira os 11 dígitos do CPF.");
      return;
    }
    if (phone && (phone.length < 10 || phone.length > 11)) {
      setError("Informe o telefone com DDD.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await registrarUsuario(user);
      if (response.status === 201) {
        updateUser({ senha: "", codigoEmail: "", imagemPerfilUsuario: null });
        router.replace("/register/aprovacao");
      } else setError("Não foi possível finalizar o cadastro.");
    } catch {
      setError(
        "Não foi possível cadastrar. Confira seus dados e o código de email.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Tudo pronto para começar"
      description="Confira seus dados e envie o cadastro para aprovação do gestor."
      step={4}
    >
      <Field
        label="Nome"
        value={user.nome || ""}
        onChangeText={(nome) => updateUser({ nome })}
      />
      <Text muted>{user.email}</Text>
      <Text small muted>
        {user.nomeCede || "Sede selecionada"}
      </Text>
      <Disclosure
        title="Foto e dados pessoais"
        summary="Foto de perfil, CPF e telefone"
      >
        <ProfilePicture onImageSelected={photo} />
        <Field
          label="CPF"
          value={user.cpf || ""}
          onChangeText={(cpf) => updateUser({ cpf })}
          keyboardType="number-pad"
          maxLength={14}
        />
        <Field
          label="Telefone"
          value={user.telefone || ""}
          onChangeText={(telefone) => updateUser({ telefone })}
          keyboardType="phone-pad"
          maxLength={16}
        />
      </Disclosure>
      <ErrorText>{error}</ErrorText>
      <Button loading={busy} icon="check" onPress={submit}>
        Finalizar cadastro
      </Button>
    </AuthScreen>
  );
}
