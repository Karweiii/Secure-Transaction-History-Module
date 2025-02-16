import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function SetPinScreen() {
  const [pin, setPin] = useState('');

  async function handlePinPress(value: string) {
    if (pin.length < 6) {
      setPin(pin + value);
    }
    if (pin.length === 5) {
      await SecureStore.setItemAsync('user_pin', pin + value);
      Alert.alert("PIN Set", "Your PIN has been saved.");
      router.replace('/login');
    }
  }

  function handleDelete() {
    setPin(pin.slice(0, -1));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your 6-Digit PIN</Text>
      
      {/* PIN Indicator Dots */}
      <View style={styles.pinContainer}>
        {Array(6).fill(0).map((_, index) => (
          <View key={index} style={[styles.pinDot, pin.length > index && styles.filledDot]} />
        ))}
      </View>

      {/* Number Pad */}
      <View style={styles.numPad}>
        {[1,2,3,4,5,6,7,8,9,0].map((num, index) => (
          <TouchableOpacity key={index} style={styles.numButton} onPress={() => handlePinPress(num.toString())}>
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numButton} onPress={handleDelete}>
          <Text style={styles.numText}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  pinContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  pinDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#007bff', margin: 5 },
  filledDot: { backgroundColor: '#007bff' },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', width: 220, justifyContent: 'center' },
  numButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', margin: 5, backgroundColor: '#ddd', borderRadius: 30 },
  numText: { fontSize: 24, fontWeight: 'bold' },
});
