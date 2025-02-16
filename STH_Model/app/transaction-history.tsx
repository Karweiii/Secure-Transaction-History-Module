import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, FlatList, RefreshControl, Alert, TouchableOpacity, Text, Modal, Pressable } from "react-native";
import TransactionItem from "../components/TransactionItem";
import { transactions as mockTransactions } from "../data/transactions";
import * as LocalAuthentication from "expo-local-authentication";
import { Transaction } from "../models/Transaction";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StyleSheet } from "react-native";

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [refreshing, setRefreshing] = useState(false);
  const [amountVisible, setAmountVisible] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [bioEnabled, setBioEnabled] = useState(true);
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const router = useRouter();
  const maxAttempts = 3;

  // Get paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    return paginatedTransactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
      const dateKey = new Date(transaction.date).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(transaction);
      return groups;
    }, {});
  }, [paginatedTransactions]);

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < Math.ceil(transactions.length / transactionsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setTransactions([...mockTransactions]);
      setRefreshing(false);
    }, 1000);
  }, []);

  // Biometric authentication
  const tryBiometricAuth = async () => {
    if (!bioEnabled || attemptCount >= maxAttempts) {
      setBioEnabled(false);
      setPasscodeModalVisible(true);
      return false;
    }

    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Use biometrics to reveal amounts",
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

  // Toggle amount visibility
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

  // Handle passcode submission
  const handlePasscodeSubmit = async () => {
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
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setPasscodeModalVisible(false);
    setEnteredPin("");
  };

  // Navigate to transaction detail
  const navigateToTransactionDetail = (transactionId: string) => {
    router.push(`/transaction-detail/${transactionId}`);
  };

  // Watch PIN length and validate automatically
  useEffect(() => {
    if (enteredPin.length === 6) {
      handlePasscodeSubmit();
    }
  }, [enteredPin]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.headerButtonText}>{"< Back"}</Text>
        </Pressable>
        <TouchableOpacity onPress={authenticateAndToggle} style={styles.backButton}>
          <Text style={styles.headerButtonText}>
            {amountVisible ? "Hide Amount" : "Reveal Amount"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 24, fontWeight: "bold", marginTop: 20, textAlign: "center" }}>
        Transaction History
      </Text>

      <FlatList
        data={Object.keys(groupedTransactions)}
        keyExtractor={(date) => date}
        renderItem={({ item: date }) => (
          <View>
            <Text style={styles.dateHeader}>{date}</Text>
            {groupedTransactions[date].map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onPress={() => navigateToTransactionDetail(transaction.id)}
                amountVisible={amountVisible}
              />
            ))}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingTop: 10 }}
      />

      <View style={styles.paginationContainer}>
        <TouchableOpacity onPress={handlePreviousPage} disabled={currentPage === 1}>
          <Text style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>Page {currentPage}</Text>
        <TouchableOpacity onPress={handleNextPage} disabled={currentPage === Math.ceil(transactions.length / transactionsPerPage)}>
          <Text style={[styles.paginationButton, currentPage === Math.ceil(transactions.length / transactionsPerPage) && styles.disabledButton]}>Next</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={passcodeModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Your 6-Digit PIN</Text>
            <View style={styles.pinIndicator}>
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <View key={index} style={[styles.pinDot, enteredPin.length > index && styles.filledDot]} />
                ))}
            </View>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "⌫"].map((key, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.keypadButton, key === 0 ? { marginLeft: 70 } : {}]}
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
            <TouchableOpacity onPress={handleModalCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  dateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginTop: 10,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    color: '#ccc',
  },
  paginationText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});