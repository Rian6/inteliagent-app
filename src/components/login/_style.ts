import { colors } from '@root/theme';
import {
  primaryColor,
  textPrimaryColor,
  white,
} from "@root/components/_default/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
    justifyContent: "center",
  },
  containerSubmit: {
    width: "100%",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    marginTop: 20,
  },
  buttonValidar: {
    width: "100%", maxWidth: 480,
    minHeight: 48,
    marginTop: 24,
    backgroundColor: primaryColor,
  },
  buttonEnviar: {
    width: "100%", maxWidth: 480,
    minHeight: 48,
    marginTop: 24,
    backgroundColor: primaryColor,
  },
  buttonEnviarNovamente: {
    alignSelf: "flex-start",
    width: "100%",
    minHeight: 48,
  },
  textOu: {
    marginTop: 20,
    textAlign: "center",
    color: textPrimaryColor,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    color: colors.onSurface,
    fontFamily: "Ubuntu-Bold",
    fontWeight: "400",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: textPrimaryColor,
  },
  subtitleLeft: {
    marginTop: 8,
    color: textPrimaryColor,
  },
});
