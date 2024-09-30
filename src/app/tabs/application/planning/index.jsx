import { useState } from 'react';
import { View, StyleSheet, Button, Platform, Text } from 'react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha de Registro Diário Antivetorial</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>

<h1>Ficha de Registro Diário Antivetorial</h1>

<table>
    <thead>
        <tr>
            <th>Data</th>
            <th>Local</th>
            <th>Nome do Agente</th>
            <th>Tipo de Vetor</th>
            <th>Método de Controle</th>
            <th>Número de Imóveis Visitados</th>
            <th>Número de Focos Encontrados</th>
            <th>Número de Pessoas Abordadas</th>
            <th>Resultados da Aplicação</th>
            <th>Condições Climáticas</th>
            <th>Registro de Notificações de Casos</th>
            <th>Encaminhamentos</th>
            <th>Observações</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>01/10/2024</td>
            <td>Bairro Centro</td>
            <td>Maria da Silva</td>
            <td>Aedes aegypti</td>
            <td>Fumacê</td>
            <td>50</td>
            <td>10</td>
            <td>30</td>
            <td>Eficaz</td>
            <td>Ensolarado</td>
            <td>1 caso notificado</td>
            <td>Visita agendada para 08/10/2024</td>
            <td>Precisa de mais educação em saúde</td>
        </tr>
        <!-- Adicione mais linhas conforme necessário -->
    </tbody>
</table>

</body>
</html>

`;

export default function App() {
  const [selectedPrinter, setSelectedPrinter] = useState();

  const print = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    await Print.printAsync({
      html,
      printerUrl: selectedPrinter?.url, // iOS only
    });
  };

  const printToFile = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const selectPrinter = async () => {
    const printer = await Print.selectPrinterAsync(); // iOS only
    setSelectedPrinter(printer);
  };

  return (
    <View style={styles.container}>
      <Button title="Vizualizar PDF" onPress={print} />
      <View style={styles.spacer} />
      <Button title="Salvar pdf" onPress={printToFile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    flexDirection: 'column',
    padding: 8,
  },
  spacer: {
    height: 8,
  },
  printer: {
    textAlign: 'center',
  },
});
