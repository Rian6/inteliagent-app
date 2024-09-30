import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BarChart from "@root/components/_default/chart/BarChart";
import LineChart from "@root/components/_default/chart/LineChart";
import { backgroudPrimary } from "@root/components/_default/colors";
import VisitaListItem from "@root/components/main_screen/VisitaListItem";

const Home = () => {
  const data = [
    { id: 1, title: 'Avenida Sabiá, 1638' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' },
    { id: 4, title: 'Item 3' },
    { id: 5, title: 'Item 3' },
  ];

  return (
    <ScrollView bounces={false}>
      <View style={styles.container}>
        <Text style={styles.textUltimasVisitas}>Últimas Visitas Realizadas</Text>
        <VisitaListItem data={data} />
        <BarChart
          label={"Endemias Por Bairro"}
          width={400}
          height={250}
          data={[10, 1, 2, 3, 4, 5, 8, 1]}
          labels={["teste", "teste2", "asasd", "asda", "asdas", "asdas", "asdasdas", "asd"]}
        />
        <LineChart
          label={"Endemias Por Dia"}
          width={400}
          height={250}
          data={[10, 5, 6, 7, 8, 10, 12, 15]}
          labels={["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto"]}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: backgroudPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  textUltimasVisitas: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Home;
