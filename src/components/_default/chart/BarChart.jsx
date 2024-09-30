import React, { useEffect, useState } from "react";
import { backgroudPrimary, primariaClara, primaryColor, white } from "@root/components/_default/colors";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export default function BarChart({ width = 100, height = 100, labels = [], data = [], label = "" }) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const loadHtmlContent = async () => {
      try {
        // Carregar o arquivo HTML da pasta assets
        const asset = Asset.fromModule(require('../../../assets/template/chart/barchart-template.html'));
        await asset.downloadAsync();
        const fileUri = asset.localUri;

        // Ler o conteúdo do arquivo HTML
        const html = await FileSystem.readAsStringAsync(fileUri);

        // Atualizar o HTML com os dados
        const updatedHtml = html
          .replace(/&VAR{LABEL}/g, label)
          .replace(/&VAR{BACKGROUND_COLOR}/g, backgroudPrimary) // Cor de fundo da página
          .replace(/&VAR{CHART_BACKGROUND_COLOR}/g, backgroudPrimary) // Cor de fundo do gráfico
          .replace(/&VAR{LABELS}/g, JSON.stringify(labels))
          .replace(/&VAR{DATA}/g, JSON.stringify(data))
          .replace(/&VAR{BORDER_COLOR}/g, `'${primaryColor}'`) // Cor da borda
          .replace(/&VAR{BAR_BACKGROUND_COLOR}/g, `'${primariaClara}'`); // Cor de fundo das barras

        // Atualizar o estado com o conteúdo HTML modificado
        setHtmlContent(updatedHtml);
      } catch (error) {
        console.error("Error loading HTML content:", error);
      }
    };

    loadHtmlContent();
  }, [labels, data, label]);

  return (
    <View style={{ width, height }}>
      <WebView
        scrollEnabled={false}
        style={{ flex: 1 }}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        scalesPageToFit={false}
        bounces={false}
        overScrollMode="never"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: white,
    alignItems: "center",
    justifyContent: "center",
  },
});
