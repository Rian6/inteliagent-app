import { View } from "react-native";
import { Field, ErrorText } from "@root/components/ui";
export default function LocalityCodeField({
  value = {},
  onChange,
  disabled = false,
  required = false,
  error = "",
}: {
  value?: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Field
        label={required ? "Código da localidade *" : "Código da localidade"}
        value={value.codigoLocalidade || ""}
        editable={!disabled}
        onChangeText={(codigoLocalidade) =>
          onChange({ ...value, codigoLocalidade })
        }
        maxLength={32}
      />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
