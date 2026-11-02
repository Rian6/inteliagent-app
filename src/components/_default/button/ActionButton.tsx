import { Button, type ButtonProps } from "react-native-paper";

/** Consistent touch targets and a single clear primary action across forms. */
export default function ActionButton({
  style,
  contentStyle,
  ...props
}: ButtonProps) {
  return (
    <Button
      {...props}
      style={[{ borderRadius: 14 }, style]}
      contentStyle={[{ minHeight: 52 }, contentStyle]}
    />
  );
}
