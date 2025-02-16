// TransactionItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Transaction } from '../models/Transaction';

export interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  amountVisible: boolean;
  style?: StyleProp<ViewStyle>;  // Add style prop to the interface
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onPress, 
  amountVisible,
  style 
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{transaction.description}</Text>
        {amountVisible ? (
          <Text style={[
            styles.amount,
            { color: transaction.type ==="credit" ? '#2E8B57' : '#DC143C' }
          ]}>
            {transaction.type ==="credit"
              ? `+ RM ${transaction.amount.toFixed(2)}` 
              : `- RM ${Math.abs(transaction.amount).toFixed(2)}`}
          </Text>
        ) : (
          <Text style={[styles.hiddenAmount,{color: transaction.type ==="credit" ? '#2E8B57' : '#DC143C'}]}>****</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
  },
  hiddenAmount: {
    fontSize: 16,
    color: '#666',
  },
});

export default TransactionItem;