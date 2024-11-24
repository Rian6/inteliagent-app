import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { backgroudPrimary, textPrimaryColor } from "@root/components/_default/colors";
import DateTimePicker from "@react-native-community/datetimepicker";

const DatePickerInput = ({
  label,
  placeholder = "Selecione uma data",
  style,
  onDateChange,
  initialDate = new Date(),
}) => {
  const [date, setDate] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);
    onDateChange && onDateChange(currentDate);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <TouchableOpacity style={styles.pickerContainer} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{formatDate(date) || placeholder}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    marginVertical: 18,
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "white",
    zIndex: 1,
    paddingHorizontal: 5,
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
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  dateText: {
    color: "#333",
    fontSize: 16,
  },
});

export default DatePickerInput;
