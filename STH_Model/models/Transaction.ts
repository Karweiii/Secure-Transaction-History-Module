export interface Transaction {
    id: string;
    amount: number;
    date: string; // ISO format 
    description: string;
    type: 'debit' | 'credit'; 
    category?: string;
  }