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
    width: 350,
    height: 50,
    marginTop: 30,
    backgroudColor: primaryColor,
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
  textOu: {
    marginTop: 20,
    textAlign: "center",
    color: textPrimaryColor,
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
  subtitleLeft: {
    marginTop: 10,
    color: textPrimaryColor,
  },
});
