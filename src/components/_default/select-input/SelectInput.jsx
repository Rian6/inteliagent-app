import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { backgroudPrimary, textPrimaryColor } from "@root/components/_default/colors";

const SelectInput = ({
  label,
  items = [],
  selectedValue,
  onValueChange,
  placeholder = "Selecione uma opção",
  style,
}) => {
  return (
    <View style={[style]}>
      <View style={styles.labelContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => onValueChange(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label={placeholder} value="" />
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "white",
    zIndex: 1, // Assegura que o label fique na frente
  },
  label: {
    fontSize: 14,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: textPrimaryColor,
    borderRadius: 5,
    backgroundColor: backgroudPrimary,
    height: 56
},
  picker: {
    height: 50,
    color: "#333",
  },
});

export default SelectInput;
