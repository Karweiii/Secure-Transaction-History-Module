import { transactions } from '../data/transactions';
import { Transaction } from '../models/Transaction';

export async function fetchTransactions(): Promise<Transaction[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(transactions);
    }, 1000); // Simulating network delay
  });
}
