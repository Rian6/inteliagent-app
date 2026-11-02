import Button from "@root/components/_default/button/ActionButton";
import { colors } from "@root/theme";
import { View } from "react-native";
import { Text, Card } from "react-native-paper";
import { router } from "expo-router";
export default function Aprovacao() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <Card>
        <Card.Content>
          <Text variant="headlineMedium">Cadastro enviado</Text>
          <Text variant="bodyLarge" style={{ marginVertical: 20 }}>
            Seu gestor precisa aprovar a conta no painel da sede. Após a
            aprovação, você poderá entrar com seu email e senha.
          </Text>
          <Button
            contentStyle={{ minHeight: 48 }}
            mode="contained"
            onPress={() => router.replace("/login")}
          >
            Ir para o login
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
