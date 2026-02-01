"use client";

import { useEffect, useState } from "react";
import { Coins, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseFetch } from "@/lib/supabaseFetch";

interface CreditBalance {
  current: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export function CreditDisplay() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const response = await supabaseFetch("/api/credits");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setTransactions(data.recentTransactions);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const formatCredits = (credits: number) => {
    if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(1)}M`;
    if (credits >= 1_000) return `${(credits / 1_000).toFixed(1)}K`;
    return credits.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 border border-purple-500/20 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const isNegative = balance.current < 0;
  const isNearLimit = balance.current < -5000; // Warning when within 5k of limit

  return (
    <div className="space-y-4">
      {/* Negative Balance Warning */}
      {isNegative && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            isNearLimit 
              ? 'bg-red-900/20 border-red-500/50' 
              : 'bg-orange-900/20 border-orange-500/50'
          }`}
        >
          <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
            isNearLimit ? 'text-red-400' : 'text-orange-400'
          }`} />
          <div className="flex-1">
            <h4 className={`text-sm font-semibold mb-1 ${
              isNearLimit ? 'text-red-300' : 'text-orange-300'
            }`}>
              {isNearLimit ? 'Credit Limit Warning' : 'Negative Balance'}
            </h4>
            <p className="text-xs text-gray-300">
              {isNearLimit 
                ? `You're approaching your credit limit (-10,000). Please add credits soon to continue using the service.`
                : `You're using credits on credit. Add more credits to get back to positive balance.`
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 border rounded-lg ${
          isNegative 
            ? 'bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-500/30'
            : 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className={`h-6 w-6 ${isNegative ? 'text-red-400' : 'text-purple-400'}`} />
            <h3 className="text-lg font-semibold text-white">Credit Balance</h3>
          </div>
          <button
            onClick={fetchCredits}
            className={`p-2 rounded-lg transition-colors ${
              isNegative ? 'hover:bg-red-600/20' : 'hover:bg-purple-600/20'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isNegative ? 'text-red-400' : 'text-purple-400'}`} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className={`text-4xl font-bold mb-2 ${
            isNegative ? 'text-red-400' : 'gradient-text'
          }`}>
            {balance.current < 0 ? '-' : ''}{formatCredits(Math.abs(balance.current))}
          </div>
          <div className="text-sm text-gray-400">
            {isNegative ? 'credits in debt' : 'credits available'} (≈{formatCredits(Math.abs(balance.current))} tokens)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Earned</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCredits(balance.lifetimeEarned)}
            </div>
          </div>
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Spent</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCredits(balance.lifetimeSpent)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gray-900 border border-purple-500/20 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-gray-400 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm text-white">{transaction.description}</div>
                  <div className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    transaction.amount > 0 ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}{formatCredits(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
