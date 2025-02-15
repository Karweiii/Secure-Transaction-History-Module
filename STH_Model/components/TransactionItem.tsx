import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Transaction } from "../models/Transaction";

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  amountVisible: boolean;
}

export default function TransactionItem({ transaction, onPress,amountVisible }: TransactionItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.date}>{new Date(transaction.date).toDateString()}</Text>
      </View>
      <Text style={[styles.amount, transaction.type === "credit" ? styles.credit : styles.debit]}>
        {amountVisible ? `${transaction.type==="credit"? "+":"-"}$${transaction.amount.toFixed(2)}` : "****"}
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", padding: 15, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  description: { fontSize: 16, fontWeight: "bold" },
  date: { fontSize: 12, color: "#666" },
  amount: { fontSize: 16, fontWeight: "bold" },
  credit: { color: "green" },
  debit: { color: "red" },
});
