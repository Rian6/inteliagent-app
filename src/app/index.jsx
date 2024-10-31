import React, { useEffect, useState } from "react";
import { Text, View, Image, Alert } from "react-native";
import { router } from "expo-router";
import Button from "@root/components/_default/button/Button";
import { primaryColor, white } from "@root/components/_default/colors";
import { stylesTelaInicial } from "@root/app/_style";
import { runMigrations } from "@root/db/_createDatabase";
import SnackBar from "@root/components/_default/snack-bar/SnackBar";
import { documentDirectory, copyAsync } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { DATABASE_NAME } from "@root/constants/database";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function App() {
  useEffect(() => {
    const initializeDatabase = async () => {
      await runMigrations();
      exportDatabase();
    };

    initializeDatabase();
  }, []);

  async function exportDatabase() {
    try {
      const databasePath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const exportPath = `${FileSystem.documentDirectory}${DATABASE_NAME}`;

      // Copia o banco de dados para um local compartilhável
      await FileSystem.copyAsync({
        from: databasePath,
        to: exportPath,
      });

      // Compartilha o arquivo, se o recurso estiver disponível no dispositivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportPath);
      }
    } catch (error) {
      console.error("Erro ao exportar o banco de dados:", error);
      Alert.alert("Erro", "Não foi possível exportar o banco de dados.");
    }
  }

  function goToLogin() {
    router.navigate("login");
  }

  function goToRegister() {
    router.navigate("register");
  }

  return (
    <View style={stylesTelaInicial.container}>
      <Image
        source={require("../assets/images/houses_banner.png")}
        width={100}
        height={100}
        style={stylesTelaInicial.image}
      />
      <Text style={stylesTelaInicial.title}>InteliAgent</Text>
      <Text style={stylesTelaInicial.subtitle}>
        Soluções rápidas para a sua rotina de combate a endemias.
      </Text>
      <Button
        title={"Criar nova conta"}
        styleLabel={stylesTelaInicial.buttonNovaConta}
        styleText={{ color: white }}
        onPress={goToRegister}
      />
      <Button
        title={"Ja possui uma conta?"}
        styleLabel={stylesTelaInicial.buttonLogin}
        styleText={{ color: primaryColor }}
        onPress={goToLogin}
      />
    </View>
  );
}
