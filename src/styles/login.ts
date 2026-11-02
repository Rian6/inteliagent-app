import { colors } from '@root/theme';
import { primaryColor, textPrimaryColor, white, backgroudPrimary } from "@root/components/_default/colors";
import { StyleSheet } from "react-native";

export const stylesTelaInicial = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "flex-start",
    paddingTop: 32,
    paddingBottom: 32,
  },
  containerScroll: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    },
  containerAprovacao: {
    flex: 0.5,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  containerConfirma: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  containerSubmit: {
    width: "100%",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    alignContent: 'flex-start',
    marginTop: 20,
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
    marginVertical: 10,
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
    textAlign: "left",
    color: textPrimaryColor,
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
  image: {
    width: 200,
    height: 200,
    borderRadius: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    color: colors.onSurface,
    fontFamily: "Inter-SemiBold",
    fontWeight: "400",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "left",
    color: textPrimaryColor,
  },
});
