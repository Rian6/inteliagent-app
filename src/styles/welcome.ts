import { colors } from '@root/theme';
import { primaryColor, textPrimaryColor, white } from "@root/components/_default/colors";
import { StyleSheet } from "react-native";

export const stylesTelaInicial = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  buttonNovaConta: {
    width: "100%", maxWidth: 480,
    minHeight: 48,
    marginTop: 24,
    backgroundColor: primaryColor,
  },
  buttonSocial: {
    width: "100%", maxWidth: 480,
    minHeight: 48,
    marginTop: 24,
    backgroundColor: white,
  },
  buttonLogin: {
    width: "100%", maxWidth: 480,
    minHeight: 48,
    marginTop: 24,
  },
  buttonEsqueciSenha: {
    alignSelf: 'flex-start',
    maxWidth: 480,
    minHeight: 48,
  },
  textOu:{
    marginTop: 20,
    textAlign: "center",
    color: textPrimaryColor,
  },
  image: {
    width: "100%", maxWidth: 480,
    minHeight: 480,
    borderRadius: 24,
    marginBottom: 20,
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
});
