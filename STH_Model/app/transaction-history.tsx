import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, FlatList, RefreshControl, Alert, TouchableOpacity, Text,StatusBar,Platform, Modal,SafeAreaView, Pressable,useWindowDimensions } from "react-native";
import TransactionItem from "../components/TransactionItem";
import { transactions as mockTransactions } from "../data/transactions";
import * as LocalAuthentication from "expo-local-authentication";
import { Transaction } from "../models/Transaction";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StyleSheet } from "react-native";

export default function TransactionHistoryScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const isTablet = width >= 768;
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
  const styles = makeStyles(width, height, isSmallDevice, isTablet);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={[ styles.headerButton]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonText}>{"< Back"}</Text>
          </Pressable>
          <TouchableOpacity 
            onPress={authenticateAndToggle} 
            style={[ styles.headerButton]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonText}>
              {amountVisible ? "Hide Amount" : "Reveal Amount"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Transaction History</Text>

        <FlatList
          data={Object.keys(groupedTransactions)}
          keyExtractor={(date) => date}
          renderItem={({ item: date }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {groupedTransactions[date].map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => navigateToTransactionDetail(transaction.id)}
                  amountVisible={amountVisible}
                  style={styles.transactionItem}
                />
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.paginationContainer}>
          <TouchableOpacity 
            onPress={handlePreviousPage} 
            disabled={currentPage === 1}
            style={styles.paginationButton}
          >
            <Text style={[
              styles.paginationButtonText, 
              currentPage === 1 && styles.disabledButton
            ]}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>Page {currentPage}</Text>
          <TouchableOpacity 
            onPress={handleNextPage} 
            disabled={currentPage === Math.ceil(transactions.length / transactionsPerPage)}
            style={styles.paginationButton}
          >
            <Text style={[
              styles.paginationButtonText,
              currentPage === Math.ceil(transactions.length / transactionsPerPage) && styles.disabledButton
            ]}>Next</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={passcodeModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Enter Your 6-Digit PIN</Text>
              <View style={styles.pinIndicator}>
                {Array(6).fill(0).map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.pinDot,
                      enteredPin.length > index && styles.filledDot
                    ]} 
                  />
                ))}
              </View>
              <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "⌫"].map((key, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.keypadButton,
                      key === 0 && styles.keypadButtonZero
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
              <TouchableOpacity 
                onPress={handleModalCancel} 
                style={styles.cancelButton}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: isTablet ? 60 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 20 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: isSmallDevice ? 8 : 10,
  },
  headerButtonText: {
    fontSize: isTablet ? 20 : isSmallDevice ? 16 : 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: isTablet ? 28 : isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  dateGroup: {
    marginBottom: isTablet ? 15 : 10,
  },
  dateHeader: {
    fontSize: isTablet ? 20 : isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: isTablet ? 15 : 10,
    marginTop: isTablet ? 15 : 10,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  transactionItem: {
    padding: isTablet ? 20 : isSmallDevice ? 12 : 15,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isTablet ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    padding: 10,
  },
  paginationButtonText: {
    fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  paginationText: {
    fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: isTablet ? 400 : 320,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: isTablet ? 30 : 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    marginBottom: isTablet ? 20 : 15,
  },
  pinIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: isTablet ? 25 : 20,
  },
  pinDot: {
    width: isTablet ? 15 : 12,
    height: isTablet ? 15 : 12,
    borderRadius: isTablet ? 7.5 : 6,
    borderWidth: 2,
    borderColor: '#007bff',
    margin: isTablet ? 7 : 5,
  },
  filledDot: {
    backgroundColor: '#007bff',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: isTablet ? 300 : 240,
  },
  keypadButton: {
    width: isTablet ? 75 : 60,
    height: isTablet ? 75 : 60,
    margin: isTablet ? 7 : 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isTablet ? 37.5 : 30,
    backgroundColor: '#f0f0f0',
  },
  keypadButtonZero: {
    marginLeft: isTablet ? 87 : 70,
  },
  keypadText: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: isTablet ? 20 : 15,
    padding: isTablet ? 15 : 10,
    width: '80%',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: isTablet ? 20 : 16,
    fontWeight: 'bold',
  },
});