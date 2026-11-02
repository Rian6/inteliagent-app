import { useState, useEffect } from "react";
import { router, Redirect } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import { Button, Field, ErrorText, Text } from "@root/components/ui";
import useUserStore from "@root/context/userContext";
import {
  enviaEmailValidacaoCodigo,
  validateRegisterUser,
} from "@root/service/usuario/usuarioService";
export default function Verification() {
  const { user, updateUser } = useUserStore();
  const [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sending, setSending] = useState(false),
    [sent, setSent] = useState(false);
  async function send() {
    if (!user.email || sending) return;
    setSending(true);
    setError("");
    try {
      await enviaEmailValidacaoCodigo(user.email);
      useUserStore.getState().setVerifiedEmail("");
      setSent(true);
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setSending(false);
    }
  }
  useEffect(() => {
    if (user.email && user.idCede) send();
  }, []);
  if (!user.email || !user.idCede)
    return <Redirect href="/register/aprovacaoId" />;
  async function next() {
    if (busy) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Informe os 6 dígitos do código.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      updateUser({ codigoEmail: code });
      const response = await validateRegisterUser({
        ...user,
        codigoEmail: code,
      });
      if (response.status === 200) {
        useUserStore.getState().setVerifiedEmail(user.email);
        router.push("/register/confirmaCadastroScreen");
      } else setError("Código inválido. Confira seu email.");
    } catch {
      setError(
        "Não foi possível validar o código. Confira os dados e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Confira seu email"
      description={`Digite o código enviado para ${user.email}.`}
      step={3}
    >
      <Field
        label="Código de verificação"
        placeholder="000000"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
        maxLength={6}
        keyboardType="number-pad"
        autoComplete="one-time-code"
      />
      <ErrorText>{error}</ErrorText>
      <Button loading={busy} icon="arrow-right" onPress={next}>
        Validar e continuar
      </Button>
      <Button variant="ghost" loading={sending} onPress={send}>
        Enviar código novamente
      </Button>
      {sent && (
        <Text small muted>
          Verifique também a pasta de spam.
        </Text>
      )}
    </AuthScreen>
  );
}
