import { useState } from "react";
import { router } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import { Field, Button, Text, ErrorText } from "@root/components/ui";
import { api } from "@root/service/default/defaultHTTPService";
import { AUTHSERVICE } from "@root/constants/urls";
export default function Recover() {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Informe um email válido.");
      return;
    }
    if (sent && (code.length !== 6 || password.length < 12)) {
      setError(
        "Confira o código de 6 dígitos e use uma senha de pelo menos 12 caracteres.",
      );
      return;
    }
    setBusy(true);
    try {
      if (!sent) {
        await api.post(`${AUTHSERVICE}/api/user/password/request`, {
          email: email.trim(),
        });
        setSent(true);
      } else {
        await api.post(`${AUTHSERVICE}/api/user/password/reset`, {
          email: email.trim(),
          code,
          password,
        });
        setPassword("");
        router.replace("/login");
      }
    } catch {
      setError(
        "Não foi possível concluir. Confira os dados e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Recuperar acesso"
      description={
        sent
          ? "Se a conta existir, o código enviado vale por 10 minutos."
          : "Informe o email da sua conta para receber um código."
      }
    >
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!sent}
      />
      {sent && (
        <>
          <Field
            label="Código de 6 dígitos"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />
          <Field
            label="Nova senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Text small muted>
            Use pelo menos 12 caracteres.
          </Text>
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <Button loading={busy} onPress={submit}>
        {sent ? "Atualizar senha" : "Receber código"}
      </Button>
    </AuthScreen>
  );
}
