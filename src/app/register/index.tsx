import { useState } from "react";
import { router } from "expo-router";
import AuthScreen from "@root/components/auth/AuthScreen";
import { Button, Field, Text } from "@root/components/ui";
import useUserStore from "@root/context/userContext";
export default function Register() {
  const { user, updateUser } = useUserStore();
  const [confirm, setConfirm] = useState(""),
    [attempted, setAttempted] = useState(false),
    [show, setShow] = useState(false);
  const errors = {
    nome: !String(user.nome || "").trim() ? "Informe seu nome." : "",
    email: !/^\S+@\S+\.\S+$/.test(user.email || "")
      ? "Informe um email válido."
      : "",
    senha:
      String(user.senha || "").length < 12
        ? "Use pelo menos 12 caracteres."
        : "",
    confirm:
      confirm !== user.senha || !confirm
        ? "As senhas precisam ser iguais."
        : "",
  };
  function next() {
    setAttempted(true);
    if (Object.values(errors).some(Boolean)) return;
    updateUser({
      nome: user.nome.trim(),
      email: user.email.trim().toLowerCase(),
    });
    router.push("/register/aprovacaoId");
  }
  return (
    <AuthScreen
      title="Crie sua conta"
      description="Vamos começar com seus dados de acesso."
      step={1}
    >
      <Field
        label="Nome"
        placeholder="Como você se chama?"
        value={user.nome || ""}
        onChangeText={(nome) => updateUser({ nome })}
        autoComplete="name"
        error={attempted ? errors.nome : undefined}
      />
      <Field
        label="Email"
        placeholder="voce@exemplo.com"
        value={user.email || ""}
        onChangeText={(email) => updateUser({ email })}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        error={attempted ? errors.email : undefined}
      />
      <Field
        label="Senha"
        value={user.senha || ""}
        onChangeText={(senha) => updateUser({ senha })}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="new-password"
        error={attempted ? errors.senha : undefined}
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
      <Text small muted>
        Use pelo menos 12 caracteres para criar sua senha.
      </Text>
      <Field
        label="Confirmar senha"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="new-password"
        error={attempted ? errors.confirm : undefined}
      />
      <Button icon="arrow-right" onPress={next}>
        Continuar
      </Button>
      <Button variant="ghost" onPress={() => router.replace("/login")}>
        Já tenho uma conta
      </Button>
    </AuthScreen>
  );
}
