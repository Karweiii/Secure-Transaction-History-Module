import React, { useState,useEffect } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, Pressable, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { transactions } from "@/data/transactions";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = transactions.find((t) => t.id === id);
  const router = useRouter();
  const [amountVisible, setAmountVisible] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  
  const maxAttempts = 3;

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Transaction not found!</Text>
      </View>
    );
  }

  // 🔐 Try Biometric Authentication
  const tryBiometricAuth = async () => {
    if (!bioEnabled || attemptCount >= maxAttempts) {
      setBioEnabled(false);
      setPasscodeModalVisible(true);
      return false;
    }

    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Use biometrics to reveal amount",
        disableDeviceFallback: true,
      });

      if (biometricAuth.success) {
        setAmountVisible(true);
        setAttemptCount(0);
        return true;
      }
      
      setAttemptCount(prev => prev + 1);
      if (attemptCount + 1 >= maxAttempts) {
        Alert.alert(
          "Maximum Attempts Reached",
          "Please use your passcode to authenticate"
        );
        setBioEnabled(false);
        setPasscodeModalVisible(true);
      }
      return false;
    } catch (error) {
      setAttemptCount(prev => prev + 1);
      return false;
    }
  };

  // 🔓 Authentication and Toggle Handler
  const authenticateAndToggle = async () => {
    if (amountVisible) {
      setAmountVisible(false);
      setBioEnabled(true);
      return;
    }

    const authSuccess = await tryBiometricAuth();
    
    if (!authSuccess) {
      setBioEnabled(false);
      setPasscodeModalVisible(true);
    }
  };

  // 🔢 Handle Passcode Entry
  async function handlePasscodeSubmit() {
    const storedPin = await SecureStore.getItemAsync("user_pin");

    if (enteredPin === storedPin) {
      setAmountVisible(true);
      setAttemptCount(0);
      setBioEnabled(true);
      setPasscodeModalVisible(false);
      setEnteredPin("");
    } else {
      Alert.alert("Incorrect Passcode", "Please try again.");
      setEnteredPin("");
    }
  }

  const handleModalCancel = () => {
    setPasscodeModalVisible(false);
    setEnteredPin("");
  };

  // 🔍 Watch PIN length and validate automatically
    useEffect(() => {
      if (enteredPin.length === 6) {
        handlePasscodeSubmit();
      }
    }, [enteredPin]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"< Back"}</Text>
        </Pressable>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Transaction Details</Text>
        <Text style={[styles.title, { 
          color: transaction.type === "credit" ? "green" : "red", 
          fontSize: 30 
        }]}>
          {transaction.type === "credit" ? "+" : "-"}
          {amountVisible ? `$${transaction.amount}` : "$****"}
        </Text>
        <View style={styles.detailBox}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{transaction.description}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(transaction.date).toDateString()}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.revealButton} 
          onPress={authenticateAndToggle}
        >
          <Text style={styles.revealButtonText}>
            {amountVisible ? "Hide Amount" : "Reveal Amount"}
          </Text>
        </TouchableOpacity>

        {/* Reuse the same PIN modal from transaction-history screen */}
        <Modal visible={passcodeModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Enter Your 6-Digit PIN</Text>
        
              {/* 🔐 Passcode Indicator */}
              <View style={styles.pinIndicator}>
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={[styles.pinDot, enteredPin.length > index && styles.filledDot]} />
                  ))}
              </View>
        
              {/* 🔢 Custom Keypad */}
              <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "⌫"].map((key, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.keypadButton,
                      // Center "0" button
                      key === 0 ? { marginLeft: 70 } : {}
                    ]}
                    onPress={() => {
                      if (key === "⌫") {
                        setEnteredPin(enteredPin.slice(0, -1));
                      } else if (enteredPin.length < 6) {
                        setEnteredPin(enteredPin + key.toString());
                      }
                    }}
                  >
                    <Text style={styles.keypadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
        
              {/* 🚫 Cancel Button */}
              <TouchableOpacity onPress={handleModalCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    marginTop:50,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  detailBox: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 10 },
  label: { fontSize: 18, fontWeight: "bold", color: "#555" },
  value: { fontSize: 18, color: "#000" },
  credit: { color: "green" },
  debit: { color: "red" },
  errorText: { fontSize: 20, color: "red" },
  revealButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 320,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: 240,
  },
  keypadButton: {
    width: 60,
    height: 60,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
  },
  keypadText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    width: "80%",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#dc3545",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pinIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#007bff",
    margin: 5,
  },
  filledDot: {
    backgroundColor: "#007bff",
  },
});
