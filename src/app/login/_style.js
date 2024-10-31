import { primaryColor, textPrimaryColor, white, backgroudPrimary } from "@root/components/_default/colors";
import { StyleSheet } from "react-native";

export const stylesTelaInicial = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    justifyContent: "top",
    paddingTop: 50,
  },
  containerScroll: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    },
  containerAprovacao: {
    flex: 0.5,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  containerConfirma: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
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
    width: 350,
    height: 50,
    marginTop: 30,
    backgroundColor: primaryColor,
  },
  buttonSocial: {
    width: 350,
    height: 50,
    marginVertical: 10,
    backgroundColor: white,
  },
  buttonLogin: {
    width: 350,
    height: 50,
    marginTop: 30,
  },
  buttonEsqueciSenha: {
    alignSelf: 'flex-start',
    width: 220,
    height: 50,
  },
  textOu:{
    marginTop: 20,
    textAlign: "center",
    color: textPrimaryColor,
  },
  buttonEnviar: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroudColor: primaryColor,
  },
  buttonEnviarNovamente: {
    alignSelf: "flex-start",
    width: "100%",
    height: 30,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: textPrimaryColor,
  },
});
