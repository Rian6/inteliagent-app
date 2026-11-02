import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
  type ComponentProps,
} from "react";
import {
  View,
  Text as NativeText,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch as NativeSwitch,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { createButton } from "@gluestack-ui/core/button/creator";
import { createInput } from "@gluestack-ui/core/input/creator";
import { createSwitch } from "@gluestack-ui/core/switch/creator";
import { createAccordion } from "@gluestack-ui/core/accordion/creator";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors as c } from "@root/theme";
export const FieldErrors = createContext<Record<string, string>>({});

// gluestack v5's component factories with native styles and shared app tokens.
// This keeps the native styling pipeline and Expo Go compatibility intact.
const GSButton = createButton({
  Root: Pressable,
  Text: NativeText,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: MaterialCommunityIcons,
});
const GSInput = createInput({
  Root: View,
  Input: TextInput,
  Slot: Pressable,
  Icon: MaterialCommunityIcons,
});
const GSSwitch = createSwitch({ Root: NativeSwitch });
const GSAccordion = createAccordion({
  Root: View,
  Item: View,
  Header: View,
  Trigger: Pressable,
  Content: View,
  Icon: MaterialCommunityIcons,
  TitleText: NativeText,
  ContentText: NativeText,
});
export function Text({
  children,
  muted,
  small,
  bold,
  style,
  ...props
}: ComponentProps<typeof NativeText> & {
  muted?: boolean;
  small?: boolean;
  bold?: boolean;
}) {
  return (
    <NativeText
      {...props}
      style={[
        {
          fontFamily: bold ? "Inter-SemiBold" : "Inter-Regular",
          color: muted ? c.onSurfaceVariant : c.onSurface,
          fontSize: small ? 13 : 15,
          lineHeight: small ? 19 : 23,
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}
export function Heading({
  children,
  style,
  ...props
}: ComponentProps<typeof NativeText>) {
  return (
    <NativeText
      accessibilityRole="header"
      {...props}
      style={[
        {
          fontFamily: "Inter-SemiBold",
          fontSize: 23,
          lineHeight: 30,
          color: c.onSurface,
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}
export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  testID,
  label,
  style,
}: {
  children?: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  testID?: string;
  label?: string;
  style?: any;
}) {
  const color =
    variant === "primary"
      ? "#FFFFFF"
      : variant === "danger"
        ? c.error
        : c.primary;
  return (
    <GSButton
      testID={testID}
      accessibilityLabel={
        label || (typeof children === "string" ? children : undefined)
      }
      isDisabled={disabled || loading}
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      onPress={onPress}
      style={({ pressed }: any) => [
        {
          minHeight: 48,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor:
            variant === "primary"
              ? c.primary
              : variant === "secondary"
                ? c.primaryContainer
                : "transparent",
          opacity: disabled || loading ? 0.5 : pressed ? 0.76 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <GSButton.Spinner color={color} />
      ) : icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={color}
          accessible={false}
        />
      ) : null}
      <GSButton.Text
        style={{
          fontFamily: "Inter-SemiBold",
          fontSize: 15,
          lineHeight: 22,
          color,
          textAlign: "center",
        }}
      >
        {children}
      </GSButton.Text>
    </GSButton>
  );
}
export function Field({
  label,
  error,
  name,
  trailing,
  leading,
  ...props
}: TextInputProps & {
  label: string;
  name?: string;
  error?: string;
  trailing?: ReactNode; leading?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const errors = useContext(FieldErrors);
  error = error || (name ? errors[name] : undefined);
  return (
    <View style={{ gap: 6, flexShrink: 1 }}>
      <Text small bold>
        {label}
      </Text>
      <GSInput
        isInvalid={!!error}
        isDisabled={props.editable === false}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 50,
          borderWidth: 1,
          borderColor: error ? c.error : focused ? c.primary : c.outlineVariant,
          borderRadius: 14,
          backgroundColor: focused ? c.surface : c.surfaceVariant,
        }}
      >
        {!!leading&&<View style={{paddingLeft:14}}>{leading}</View>}
        <GSInput.Input
          {...props}
          aria-label={label}
          accessibilityLabel={label}
          placeholderTextColor={c.outline}
          selectionColor={c.primary}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[
            {
              flex: 1,
              minWidth: 0,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontFamily: "Inter-Regular",
              fontSize: 16,
              color: c.onSurface,
            },
            props.style,
          ]}
        />
        {trailing}
      </GSInput>
      {!!error && (
        <Text small style={{ color: c.error }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}
export function Choice({
  value,
  onChange,
  options,
  label,
}: {
  value: string | number;
  onChange: (value: any) => void;
  options: { value: string | number; label: string }[];
  label: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {options.map((option) => (
        <GSButton
          key={option.value}
          role="radio"
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ checked: option.value === value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }: any) => ({
            minHeight: 48,
            flex: 1,
            minWidth: 80,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: option.value === value ? c.primary : c.outlineVariant,
            backgroundColor:
              option.value === value ? c.primaryContainer : c.surface,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 10,
            paddingVertical: 10,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <GSButton.Text
            style={{
              fontFamily:
                option.value === value ? "Inter-SemiBold" : "Inter-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: option.value === value ? c.primary : c.onSurface,
              textAlign: "center",
            }}
          >
            {option.label}
          </GSButton.Text>
        </GSButton>
      ))}
    </View>
  );
}
export function Disclosure({
  title,
  summary,
  children,
  initiallyOpen = false,
  validationKeys = [],
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  validationKeys?: string[];
}) {
  const [keys, setKeys] = useState<string[]>(initiallyOpen ? ["details"] : []),
    open = keys.includes("details");
  const errors = useContext(FieldErrors);
  const invalid = validationKeys.some((key) => !!errors[key]);
  useEffect(() => {
    if (invalid) setKeys(["details"]);
  }, [invalid]);
  return (
    <GSAccordion
      value={keys}
      onValueChange={setKeys}
      type="single"
      isCollapsible
    >
      <GSAccordion.Item
        value="details"
        style={{ borderTopWidth: 1, borderColor: c.outlineVariant }}
      >
        <GSAccordion.Header>
          <GSAccordion.Trigger
            accessibilityLabel={title}
            style={{
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <GSAccordion.TitleText
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  lineHeight: 21,
                  color: c.onSurface,
                }}
              >
                {title}
              </GSAccordion.TitleText>
              {!open && !!summary && (
                <Text small muted>
                  {summary}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons
              name={open ? "chevron-up" : "chevron-down"}
              size={20}
              color={c.onSurfaceVariant}
            />
          </GSAccordion.Trigger>
        </GSAccordion.Header>
        <GSAccordion.Content
          style={{
            display: open ? "flex" : "none",
            gap: 16,
            paddingBottom: 16,
          }}
        >
          {open ? children : null}
        </GSAccordion.Content>
      </GSAccordion.Item>
    </GSAccordion>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 48,
      }}
    >
      <Text bold style={{ flex: 1 }}>
        {label}
      </Text>
      <GSSwitch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.outlineVariant, true: c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
export function Divider() {
  return <View style={{ height: 1, backgroundColor: c.outlineVariant }} />;
}
export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? (
    <Text small accessibilityLiveRegion="polite" style={{ color: c.error }}>
      {children}
    </Text>
  ) : null;
}
export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  section: { gap: 14 },
  panel: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
});

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text small bold>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: c.outlineVariant,
          borderRadius: 10,
          backgroundColor: c.surface,
        }}
      >
        <Picker
          accessibilityLabel={label}
          selectedValue={value}
          onValueChange={onChange}
          style={{ minHeight: 50, color: c.onSurface }}
        >
          <Picker.Item label="Não informado" value="" />
          {options.map((option) => (
            <Picker.Item key={option.value} {...option} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
export function DateField({
  label,
  value,
  onChange,
  empty = "Não agendado",
}: {
  label: string;
  value?: Date | string | null;
  onChange: (value: Date) => void;
  empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value
    ? new Date(typeof value === "string" ? value.replace(" ", "T") : value)
    : null;
  const valid = date && Number.isFinite(date.getTime()) ? date : null;
  return (
    <View style={{ gap: 6 }}>
      <Text small bold>
        {label}
      </Text>
      <Button
        variant="secondary"
        icon="calendar-outline"
        label={`${label}: ${valid ? valid.toLocaleDateString("pt-BR") : empty}`}
        style={{
          justifyContent: "flex-start",
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.outlineVariant,
        }}
        onPress={() => setOpen(true)}
      >
        {valid ? valid.toLocaleDateString("pt-BR") : empty}
      </Button>
      {open && (
        <DateTimePicker
          value={valid || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "compact" : "default"}
          onChange={(event, chosen) => {
            setOpen(false);
            if (event.type !== "dismissed" && chosen) onChange(chosen);
          }}
        />
      )}
    </View>
  );
}

export function CheckRow({
  label,
  selected,
  onPress,
  testID,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  children?: ReactNode;
}) {
  return (
    <GSButton
      testID={testID}
      role="checkbox"
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }: any) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 58,
        paddingVertical: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialCommunityIcons
        name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
        color={selected ? c.primary : c.outline}
        size={22}
      />
      {children}
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{label}</Text>
    </GSButton>
  );
}
export function Quantity({
  name,
  label,
  value,
  onChange,
}: {
  name?: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
}) {
  const error = useContext(FieldErrors)[name || ""];
  const change = (delta: number) =>
    onChange(
      String(Math.min(1000000, Math.max(0, (Number(value) || 0) + delta))),
    );
  return (
    <View style={{ gap: 4, maxWidth: 200, flexShrink: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Button
          variant="secondary"
          icon="minus"
          label={`Diminuir ${label}`}
          onPress={() => change(-1)}
          style={{ minHeight: 48, width: 48, paddingHorizontal: 10 }}
        />
        <GSInput
          style={{
            width: 56,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.outlineVariant,
            borderRadius: 8,
          }}
        >
          <GSInput.Input
            accessibilityLabel={label}
            aria-label={label}
            keyboardType="number-pad"
            value={String(value ?? "")}
            onChangeText={onChange}
            style={{
              textAlign: "center",
              paddingVertical: 10,
              paddingHorizontal: 2,
              color: c.onSurface,
              fontFamily: "Inter-SemiBold",
              fontSize: 16,
              minHeight: 48,
            }}
          />
        </GSInput>
        <Button
          variant="secondary"
          icon="plus"
          label={`Aumentar ${label}`}
          onPress={() => change(1)}
          style={{ minHeight: 48, width: 48, paddingHorizontal: 10 }}
        />
      </View>
      {!!error && <ErrorText>{error}</ErrorText>}
    </View>
  );
}

export function ListRow({
  title,
  detail,
  onPress,
  inProgress = false,
}: {
  title: string;
  detail: string;
  onPress: () => void;
  inProgress?: boolean;
}) {
  return (
    <GSButton
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={({ pressed }: any) => ({
        minHeight: 76,
        paddingVertical: 14,
        paddingHorizontal: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderColor: c.outlineVariant,
        backgroundColor: pressed ? c.primaryContainer : c.surface,
      })}
    >
      <View
        style={{
          height: 36,
          width: 36,
          borderRadius: 10,
          backgroundColor: inProgress ? c.primaryContainer : c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name={inProgress ? "pencil-outline" : "map-marker-outline"}
          size={20}
          color={inProgress ? c.primary : c.onSurfaceVariant}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text bold>{title}</Text>
        <Text
          small
          muted={!inProgress}
          style={inProgress ? { color: c.primary } : undefined}
        >
          {detail}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={c.outline}
      />
    </GSButton>
  );
}
