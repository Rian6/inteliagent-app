import Button from "@root/components/_default/button/ActionButton";
import { useMemo, useState } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import {
  Dialog,
  Icon,
  List,
  Portal,
  Searchbar,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { colors, shape } from "@root/theme";
type Option = { value: number; label: string };
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export default function CatalogSelect({
  label,
  items,
  value,
  onChange,
  disabled = false,
  required = false,
  error = "",
}: {
  label: string;
  items: Option[];
  value?: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const { height } = useWindowDimensions();
  const options = useMemo(
    () =>
      items.map((option) => ({ ...option, search: normalize(option.label) })),
    [items],
  );
  const filtered = useMemo(
    () =>
      options
        .filter((option) => option.search.includes(normalize(query)))
        .slice(0, 80),
    [options, query],
  );
  const chosen = items.find((option) => option.value === value);
  function close() {
    setOpen(false);
    setQuery("");
  }
  return (
    <View style={{ gap: 8 }}>
      <Text variant="labelLarge">
        {label}
        {required ? " *" : ""}
      </Text>
      <TouchableRipple
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        onPress={() => setOpen(true)}
        accessibilityLabel={`${label}: ${chosen?.label || "Selecionar"}`}
        style={{
          minHeight: 56,
          borderWidth: 1,
          borderColor: colors.outline,
          borderRadius: shape.field,
          backgroundColor: colors.surface,
        }}
        borderless
      >
        <View
          style={{
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              color: disabled ? colors.onSurfaceDisabled : colors.onSurface,
            }}
          >
            {chosen?.label || "Selecionar"}
          </Text>
          <Icon
            source="chevron-down"
            size={24}
            color={colors.onSurfaceVariant}
          />
        </View>
      </TouchableRipple>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
      <Portal>
        <Dialog
          visible={open}
          onDismiss={close}
          style={{ maxHeight: height * 0.85 }}
        >
          <Dialog.Title>{label}</Dialog.Title>
          {items.length > 15 && (
            <Dialog.Content>
              <Searchbar
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="Pesquisar município ou UF"
                accessibilityLabel="Pesquisar município ou UF"
                value={query}
                onChangeText={setQuery}
              />
            </Dialog.Content>
          )}
          <Dialog.ScrollArea style={{ maxHeight: height * 0.4 }}>
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={{ padding: 16 }}>
                  Nenhum município encontrado. Revise o nome ou a UF.
                </Text>
              }
              renderItem={({ item }) => (
                <List.Item
                  title={item.label}
                  titleNumberOfLines={4}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.value === value }}
                  onPress={() => {
                    onChange(item.value);
                    close();
                  }}
                  right={(props) =>
                    item.value === value ? (
                      <List.Icon {...props} icon="check" />
                    ) : null
                  }
                />
              )}
            />
          </Dialog.ScrollArea>
          {items.length > 80 && (
            <Dialog.Content>
              <Text variant="bodySmall">
                Mostrando até 80 resultados. Pesquise pelo nome ou UF.
              </Text>
            </Dialog.Content>
          )}
          <Dialog.Actions>
            <Button onPress={close}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
