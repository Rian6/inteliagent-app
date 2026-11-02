import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text as NativeText,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "@root/components/ui";
import { colors as c } from "@root/theme";
import { emojiCategories } from "@root/data/emojis";

export default function EmojiPicker({
  onSelect,
  disabled,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [categoryId, setCategoryId] = useState("popular");
  const [width, setWidth] = useState(300);
  const { height } = useWindowDimensions();
  const category = emojiCategories.find((item) => item.id === categoryId)!;
  const columns = Math.max(1, Math.floor(width / 44));
  return (
    <View
      accessibilityLabel="Emojis"
      style={{ height: Math.min(300, height * 0.38), minHeight: 150 }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ gap: 4 }}
      >
        {emojiCategories.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={item.title}
            accessibilityState={{ selected: categoryId === item.id }}
            onPress={() => setCategoryId(item.id)}
            style={{
              minWidth: 48,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor:
                categoryId === item.id ? c.primaryContainer : "transparent",
            }}
          >
            <NativeText allowFontScaling={false} style={{ fontSize: 23 }}>
              {item.icon}
            </NativeText>
          </Pressable>
        ))}
      </ScrollView>
      <Text small muted style={{ paddingVertical: 4 }}>
        {category.title} · {category.emojis.length} emojis
      </Text>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ flex: 1, minHeight: 0 }}
      >
        <FlatList
          testID="emoji-grid"
          key={categoryId + "-" + columns}
          data={category.emojis}
          numColumns={columns}
          keyExtractor={(value) => value}
          keyboardShouldPersistTaps="always"
          initialNumToRender={6}
          windowSize={3}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Inserir emoji " + item}
              disabled={disabled}
              onPress={() => onSelect(item)}
              style={{
                width: width / columns,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NativeText allowFontScaling={false} style={{ fontSize: 27 }}>
                {item}
              </NativeText>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}
