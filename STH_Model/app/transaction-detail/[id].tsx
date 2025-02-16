import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, Pressable, TouchableOpacity, Modal, useWindowDimensions, Platform, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { transactions } from "@/data/transactions";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = transactions.find((t) => t.id === id);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const isTablet = width >= 768;
  const [amountVisible, setAmountVisible] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  
  const maxAttempts = 3;

  const styles = makeStyles(width, height, isSmallDevice, isTablet);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Transaction not found!</Text>
      </SafeAreaView>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>{"< Back"}</Text>
        </Pressable>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Transaction Details</Text>
        <Text style={[styles.amountText, { 
          color: transaction.type === "credit" ? "#2E8B57" : "#DC143C"
        }]}>
          {transaction.type === "credit" ? "+" : "-"}
          {amountVisible ? `$${transaction.amount}` : "$****"}
        </Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailBox}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(transaction.date).toDateString()}</Text>
          </View>
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
    </SafeAreaView>
  );
}

const makeStyles = (width: number, height: number, isSmallDevice: boolean, isTablet: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: isTablet ? 60 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 20 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: isSmallDevice ? 8 : 10,
  },
  backButtonText: {
    fontSize: isTablet ? 20 : isSmallDevice ? 16 : 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    marginTop: isTablet ? 60 : 50,
    padding: isTablet ? 30 : 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: isTablet ? 28 : isSmallDevice ? 20 : 24,
    fontWeight: "bold",
    marginBottom: isTablet ? 25 : 20,
  },
  amountText: {
    fontSize: isTablet ? 36 : isSmallDevice ? 26 : 30,
    fontWeight: "bold",
    marginBottom: isTablet ? 30 : 20,
  },
  detailsContainer: {
    width: "100%",
    maxWidth: isTablet ? 600 : 450,
    marginBottom: isTablet ? 30 : 20,
  },
  detailBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: isTablet ? 15 : 10,
    padding: isTablet ? 15 : 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  label: {
    fontSize: isTablet ? 20 : isSmallDevice ? 16 : 18,
    fontWeight: "bold",
    color: "#555",
  },
  value: {
    fontSize: isTablet ? 20 : isSmallDevice ? 16 : 18,
    color: "#000",
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  errorText: {
    fontSize: isTablet ? 24 : isSmallDevice ? 18 : 20,
    color: "red",
    textAlign: 'center',
  },
  revealButton: {
    backgroundColor: '#007AFF',
    padding: isTablet ? 18 : 15,
    borderRadius: 10,
    marginTop: isTablet ? 25 : 20,
    width: isTablet ? '60%' : '80%',
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#fff',
    fontSize: isTablet ? 20 : isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: isTablet ? 400 : 320,
    backgroundColor: "white",
    borderRadius: 15,
    padding: isTablet ? 30 : 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    marginBottom: isTablet ? 20 : 15,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: isTablet ? 300 : 240,
  },
  keypadButton: {
    width: isTablet ? 75 : 60,
    height: isTablet ? 75 : 60,
    margin: isTablet ? 7 : 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: isTablet ? 37.5 : 30,
    backgroundColor: "#f0f0f0",
  },
  keypadText: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: isTablet ? 20 : 15,
    padding: isTablet ? 15 : 10,
    width: "80%",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#dc3545",
  },
  cancelButtonText: {
    color: "white",
    fontSize: isTablet ? 20 : 16,
    fontWeight: "bold",
  },
  pinIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: isTablet ? 25 : 20,
  },
  pinDot: {
    width: isTablet ? 15 : 12,
    height: isTablet ? 15 : 12,
    borderRadius: isTablet ? 7.5 : 6,
    borderWidth: 2,
    borderColor: "#007bff",
    margin: isTablet ? 7 : 5,
  },
  filledDot: {
    backgroundColor: "#007bff",
  },
});
