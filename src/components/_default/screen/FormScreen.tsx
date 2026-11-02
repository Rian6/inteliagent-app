import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementRef,
  type ReactNode,
} from "react";
import { useFocusEffect } from "expo-router";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "@root/theme";

export default function FormScreen({
  children,
  safeArea = true,
  bottomSafeArea = safeArea,
  avoidKeyboard = true,
  testID,
}: {
  children: ReactNode;
  safeArea?: boolean;
  bottomSafeArea?: boolean;
  avoidKeyboard?: boolean;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const offset = useRef(0);
  const [keyboardViewport, setKeyboardViewport] = useState<
    number | undefined
  >();
  function constrainViewport() {
    const keyboard = Keyboard.metrics?.();
    if (Platform.OS !== "android" || !active.current || !keyboard) return;
    scroll.current?.measureInWindow((_x, top) => {
      setKeyboardViewport(Math.max(0, keyboard.screenY - top));
    });
  }
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      return () => {
        active.current = false;
        if (pending.current) clearTimeout(pending.current);
      };
    }, []),
  );
  function revealFocusedInput() {
    if (!active.current) return;
    constrainViewport();
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput();
      if (!input || !active.current) return;
      input.measureInWindow((_x, y, _width, height) => {
        scroll.current?.measureInWindow((_sx, top, _sw, viewportHeight) => {
          if (!height || !viewportHeight || !active.current) return;
          const bottom = Math.min(
            top + viewportHeight,
            Keyboard.metrics?.()?.screenY ?? top + viewportHeight,
          );
          const overlap = y + height + 24 - bottom;
          if (overlap > 0)
            scroll.current?.scrollTo({
              y: Math.max(0, offset.current + overlap),
              animated: true,
            });
        });
      });
    }, 180);
  }
  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidShow",
      revealFocusedInput,
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardViewport(undefined),
    );
    return () => {
      subscription.remove();
      hide.remove();
      if (pending.current) clearTimeout(pending.current);
    };
  }, []);
  // Android already resizes the activity for the IME. A second height adjustment
  // shrinks the scroll viewport twice on edge-to-edge Samsung devices.
  return (
    <SafeAreaView
      edges={safeArea ? ["top", "left", "right"] : ["left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, maxHeight: keyboardViewport }}
        behavior={
          Platform.OS === "ios" && avoidKeyboard ? "padding" : undefined
        }
        keyboardVerticalOffset={safeArea ? 0 : insets.top + 56}
      >
        <ScrollView
          ref={scroll}
          removeClippedSubviews={false}
          onLayout={constrainViewport}
          onFocusCapture={revealFocusedInput}
          onScroll={(event) => {
            offset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          testID={testID || "form-scroll"}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "android" ? "none" : "on-drag"}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24 + (bottomSafeArea ? insets.bottom : 0),
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 640,
              alignSelf: "center",
              gap: 16,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
