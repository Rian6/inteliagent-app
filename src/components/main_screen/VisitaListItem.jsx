import React from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import VisitaItem from '@root/components/main_screen/VisitaItem';

const VisitaListItem = ({ data }) => {
  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()} // Supondo que cada item tenha um id
        renderItem={({ item }) => <VisitaItem item={item} />} // Renderizando o componente filho
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    flex: 1,
    marginBottom: 50,
    padding: 16,
  },
});

export default VisitaListItem;
