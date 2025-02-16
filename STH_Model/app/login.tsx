import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [hasSavedBio, setHasSavedBio] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    checkBiometrics();
    checkStoredPin();
  }, []);

  async function checkStoredPin() {
    const savedPin = await SecureStore.getItemAsync('user_pin');
    if (savedPin) {
      setStoredPin(savedPin);
      if(hasBiometrics && hasSavedBio) {
        authenticateWithBiometrics();
      }
    } else {
      router.replace('/setpin');
    }
  }

  async function checkBiometrics() {
    setHasBiometrics(await LocalAuthentication.hasHardwareAsync());
    setHasSavedBio(await LocalAuthentication.isEnrolledAsync());
  }

  async function authenticateWithBiometrics() {
    let attempts=0
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Face ID / Fingerprint",
      disableDeviceFallback: true,
    });

    if (result.success) {
      router.replace('/home');
      console.log("Biometric authentication successful.");
    } else {
      Alert.alert("Biometric authentication failed.", "Please enter your PIN.");
      attempts+=1;
    }
  }

  async function handlePinPress(value: string) {
    const newPin = pin + value;
    if (newPin.length <= 6) {
      setPin(newPin);
    }
    if (newPin.length === 6) {
      if (newPin === storedPin) {
        console.log("PIN matched. Logging in...");
        router.replace('/home');
        console.log("PIN authentication successful.");
      } else {
        Alert.alert("Incorrect PIN", "Please try again.");
        setPin('');
      }
    }
  }

  function handleDelete() {
    setPin(pin.slice(0, -1));
  }

  async function clearSecureStore() {
    await SecureStore.deleteItemAsync('user_pin');
    Alert.alert("Data Cleared", "All stored PIN and biometric data have been reset.");
    router.replace('/setpin');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your 6-Digit PIN</Text>

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

      {/* Biometrics & Reset Button */}
      <TouchableOpacity 
        onPress={authenticateWithBiometrics} 
        style={[
          styles.actionButton, 
          { backgroundColor: (hasBiometrics && hasSavedBio) ? '#28a745' : '#999999' }
        ]}
        disabled={!hasBiometrics || !hasSavedBio}
      >
        <Text style={styles.actionText}>Use Biometrics</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={clearSecureStore} style={[styles.actionButton, { backgroundColor: '#dc3545' }]}>
        <Text style={styles.actionText}>Reset PIN</Text>
      </TouchableOpacity>
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
  actionButton: { padding: 15, borderRadius: 8, width: 200, alignItems: 'center', marginTop: 10 },
  actionText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
