import { backgroudPrimary, primaryColor, textPrimaryColor, white } from "@root/components/_default/colors";
import { StyleSheet } from "react-native";

export const stylesTelaInicial = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonNovaConta: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroudColor: primaryColor,
  },
  buttonSocial: {
    width: 350,
    height: 50,
    marginTop: 30,
    backgroudColor: white,
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
  image: {
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
