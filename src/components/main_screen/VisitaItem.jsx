import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const VisitaItem = ({ item }) => {
  return (
    <View style={styles.itemContainer}>
      <Image style={{width: 50, height: 50, borderRadius: 10, marginRight: 10}} source={require('../../assets/images/no-image.jpg')}/>      
      <View>
        <Text style={styles.itemText}>{item.title+', '+ item.numero}</Text>
        <Text style={styles.itemTextSubtitle}>{"Sem endemias"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500'
  },
  itemTextSubtitle: {
    fontSize: 14,
  },
});

export default VisitaItem;
