import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BarChart from "@root/components/_default/chart/BarChart";
import LineChart from "@root/components/_default/chart/LineChart";
import { backgroudPrimary } from "@root/components/_default/colors";
import VisitaListItem from "@root/components/main_screen/VisitaListItem";
import { countByRegiao, findLastVisitas } from "@root/db/visitaPersistence";
import InternetStatusMonitor from "@root/components/_default/internet/InternetStatusMonitor";

const Home = () => {
  const [data, setData] = useState([]);
  const [dataPorRegiao, setDataPorRegiao] = useState([]);

  useEffect(()=>{
    const fetchVisitas = async () => {
      const tmpData = await findLastVisitas()
      setData(tmpData);

      const tmpDataGrafico1 = await countByRegiao()
      setDataPorRegiao(tmpDataGrafico1)
    }  
    fetchVisitas();
  },[])

  return (
    <ScrollView bounces={false}>
      <InternetStatusMonitor />
      <View style={styles.container}>
        <Text style={styles.textUltimasVisitas}>Últimas Visitas Realizadas</Text>
        <VisitaListItem data={data} />
        <BarChart
          label={"Visitas Por Região"}
          width={400}
          height={250}
          data={dataPorRegiao.data}
          labels={dataPorRegiao.labels}
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
