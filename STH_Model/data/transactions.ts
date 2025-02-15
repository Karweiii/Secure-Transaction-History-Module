import { Transaction } from "../models/Transaction";

export const transactions: Transaction[] = [
  { id: '1', amount: 10000, date: '2025-02-15T12:34:56Z', description: 'Salary', type: 'credit' },
  { id: '2', amount: 200, date: '2025-02-14T10:15:30Z', description: 'Electricity Bill', type: 'debit' },
  { id: '3', amount: 300, date: '2025-02-14T09:20:45Z', description: 'Water Bill', type: 'debit' },
  { id: '4', amount: 400, date: '2025-02-13T14:40:10Z', description: 'Internet Bill', type: 'debit' },
  { id: '5', amount: 500, date: '2025-02-12T16:30:00Z', description: 'Grocery', type: 'debit' },
  { id: '6', amount: 600, date: '2025-02-12T18:10:25Z', description: 'Rent', type: 'debit' },
  { id: '7', amount: 700, date: '2025-02-11T11:25:50Z', description: 'Car Loan', type: 'debit' },
  { id: '8', amount: 800, date: '2025-02-11T13:55:15Z', description: 'Shopping', type: 'debit' },
  { id: '9', amount: 900, date: '2025-02-10T08:00:00Z', description: 'Medical', type: 'credit' },
  { id: '10', amount: 1000, date: '2025-02-10T09:45:30Z', description: 'Others', type: 'debit' },
  { id: '11', amount: 1100, date: '2025-02-09T12:20:00Z', description: 'Insurance', type: 'credit' },
  { id: '12', amount: 1200, date: '2025-02-09T14:35:15Z', description: 'Shopping', type: 'debit' },
  { id: '13', amount: 1300, date: '2025-02-08T17:45:50Z', description: 'Dining Out', type: 'debit' },
  { id: '14', amount: 1400, date: '2025-02-07T10:15:00Z', description: 'Fuel', type: 'debit' },
  { id: '15', amount: 1500, date: '2025-02-06T19:30:20Z', description: 'Bonus', type: 'credit' },
  { id: '16', amount: 1600, date: '2025-02-05T08:10:45Z', description: 'Movie Tickets', type: 'debit' },
  { id: '17', amount: 1700, date: '2025-02-05T21:00:00Z', description: 'Hotel Booking', type: 'debit' },
  { id: '18', amount: 1800, date: '2025-02-04T07:40:30Z', description: 'Phone Bill', type: 'debit' },
  { id: '19', amount: 1900, date: '2025-02-03T15:25:00Z', description: 'Loan Payment', type: 'debit' },
  { id: '20', amount: 2000, date: '2025-02-02T22:10:55Z', description: 'Tax Payment', type: 'debit' }
];
