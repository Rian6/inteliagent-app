import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCurrentStep = currentStep === index;
        return (
          <View key={index} style={styles.stepContainer}>
            {/* Left Side (Time) */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{step.time}</Text>
            </View>

            {/* Middle (Circle and Line) */}
            <View style={styles.middleContainer}>
              <FontAwesome
                name={isCurrentStep ? "circle" : "check-circle"}
                size={16}
                color={isCurrentStep ? "#FF6347" : "#32CD32"}
              />
              {index < steps.length - 1 && (
                <View style={styles.line} />
              )}
            </View>

            {/* Right Side (Description) */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
    
                <Text style={styles.arrivalTime}>{!isCurrentStep && step.arrivalTime ? step.arrivalTime : '-'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timeContainer: {
    width: 50,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  middleContainer: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    width: 1.5,
    height: 50,
    backgroundColor: '#888',
    position: 'absolute',
    top: 24,
    left: 14,
  },
  descriptionContainer: {
    flex: 1,
    paddingLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrivalTime: {
    fontSize: 12,
    color: 'green',
    marginTop: 5,
  },
});

export default StepIndicator;
