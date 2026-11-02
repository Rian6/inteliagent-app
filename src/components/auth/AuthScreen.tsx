import { Image, View } from "react-native";
import { router } from "expo-router";
import FormScreen from "@root/components/_default/screen/FormScreen";
import { Button, Heading, Text } from "@root/components/ui";
import { colors as c } from "@root/theme";
import type { ReactNode } from "react";
export function BrandMark({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/icon.png")}
      accessibilityLabel="Inteliagent"
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
    />
  );
}
export default function AuthScreen({
  title,
  description,
  children,
  step,
  back = true,
}: {
  title: string;
  description: string;
  children: ReactNode;
  step?: number;
  back?: boolean;
}) {
  return (
    <FormScreen>
      <View
        style={{
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          gap: 20,
          paddingTop: 8,
        }}
      >
        {back && (
          <Button
            variant="ghost"
            icon="arrow-left"
            label="Voltar"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={{
              alignSelf: "flex-start",
              width: 48,
              paddingHorizontal: 12,
            }}
          />
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <BrandMark />
          <View>
            <Text bold>Inteliagent</Text>
            <Text small muted>
              Vigilância em saúde
            </Text>
          </View>
        </View>
        {!!step && (
          <View style={{ gap: 8 }}>
            <Text small muted>
              CRIAR CONTA · {step} DE 4
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[1, 2, 3, 4].map((n) => (
                <View
                  key={n}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 4,
                    backgroundColor: n <= step ? c.onSurface : c.outlineVariant,
                  }}
                />
              ))}
            </View>
          </View>
        )}
        <View style={{ gap: 8 }}>
          <Heading style={{ fontSize: 26, lineHeight: 34 }}>{title}</Heading>
          <Text muted>{description}</Text>
        </View>
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: 24,
            padding: 20,
            gap: 20,
          }}
        >
          {children}
        </View>
      </View>
    </FormScreen>
  );
}
