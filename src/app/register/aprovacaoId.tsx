import { useState } from "react";
import { router, Redirect } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import { Button, Field, ErrorText } from "@root/components/ui";
import useUserStore from "@root/context/userContext";
import { validateUsuariosCede } from "@root/service/cede/cedeService";
export default function Workplace() {
  const { user, updateUser } = useUserStore();
  const [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (
    !String(user.nome || "").trim() ||
    !/^\S+@\S+\.\S+$/.test(user.email || "") ||
    String(user.senha || "").length < 12
  )
    return <Redirect href="/register" />;
  async function next() {
    if (busy) return;
    if (!/^\d{5}$/.test(code)) {
      setError("Informe os 5 dígitos do código da sede.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await validateUsuariosCede(code);
      if (res?.data?.length) {
        updateUser({ idCede: res.data[0].id, nomeCede: res.data[0].nome });
        router.push("/register/verificacao");
      } else setError("Sede não encontrada. Confira o código com seu gestor.");
    } catch {
      setError("Não foi possível consultar a sede. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Qual é a sua sede?"
      description="Informe o código compartilhado pelo gestor da sua equipe."
      step={2}
    >
      <Field
        label="Código da sede"
        placeholder="00000"
        value={code}
        maxLength={5}
        keyboardType="number-pad"
        onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
      />
      <ErrorText>{error}</ErrorText>
      <Button loading={busy} icon="arrow-right" onPress={next}>
        Continuar
      </Button>
    </AuthScreen>
  );
}
