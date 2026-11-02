import {MaterialCommunityIcons} from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import { Button, Field, Text, ErrorText } from "@root/components/ui";
import { login } from "@root/service/usuario/usuarioService";
import { insertUsuario } from "@root/db/usuarioPersistence";
import { beginUpdateSession, checkForAppUpdate } from "@root/service/updates/checkAppUpdate";
export default function Login() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(""),
    [senha, setSenha] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [attempted, setAttempted] = useState(false);
  async function submit() {
    if (busy) return;
    setAttempted(true);
    setError("");
    if (!email.trim() || !senha) return;
    setBusy(true);
    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        senha,
      });
      if (response.status === 200 && response.headers?.authorization) {
        beginUpdateSession();
        await checkForAppUpdate(true);
        await insertUsuario({
          ...response.data,
          token: response.headers.authorization,
        });
        router.replace("/tabs/application/planning");
      } else setError("Não foi possível entrar. Confira seus dados.");
    } catch (cause) {
      setError(
        cause.response?.status === 401
          ? "Email ou senha incorretos. Confira os dados."
          : !cause.response && cause.isAxiosError
            ? "Não foi possível conectar. Confira o Wi-Fi e tente novamente."
            : "Não foi possível abrir sua conta. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Bom ter você de volta"
      description="Entre para organizar seu trabalho em campo."
    >
      {params.isRegisterUser === "true" && (
        <Text>Conta criada com sucesso.</Text>
      )}
      <Field
        label="Email"
        leading={<MaterialCommunityIcons name="email-outline" size={20} color="#6B6B73"/>}
        placeholder="voce@exemplo.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        error={attempted && !email.trim() ? "Informe seu email." : undefined}
      />
      <Field
        label="Senha"
        leading={<MaterialCommunityIcons name="lock-outline" size={20} color="#6B6B73"/>}
        placeholder="Sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={attempted && !senha ? "Informe sua senha." : undefined}
        trailing={
          <Button
            variant="ghost"
            icon={show ? "eye-off-outline" : "eye-outline"}
            label={show ? "Ocultar senha" : "Mostrar senha"}
            onPress={() => setShow(!show)}
            style={{ width: 48, paddingHorizontal: 12 }}
          />
        }
      />
      <Button
        variant="ghost"
        onPress={() => router.navigate("/login/recoverPassword")}
        style={{ alignSelf: "flex-end", paddingHorizontal: 0 }}
      >
        Esqueci minha senha
      </Button>
      <ErrorText>{error}</ErrorText>
      <Button loading={busy} onPress={submit}>
        Entrar
      </Button>
      <Button variant="secondary" onPress={() => router.navigate("/register")}>
        Criar uma conta
      </Button>
    </AuthScreen>
  );
}
