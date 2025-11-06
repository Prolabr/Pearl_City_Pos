"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

// ✅ reusable component
import { DateRangeFilter } from "../components/ui/DateRangeFilter";

interface CurrencyBalance {
  currencyType: string;
  openingBalance: string;
  purchases: string;
  exchangeBuy: string;
  exchangeSell: string;
  sales: string;
  deposits: string;
  closingBalance: string;
}

export default function BalanceStatement() {
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositInputs, setDepositInputs] = useState<Record<string, string>>({});

  // ✅ Fetch balance data
  const fetchBalanceData = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/balance-statement?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!res.ok) throw new Error("Failed to fetch balance data");

      const response = await res.json();

      const data: CurrencyBalance[] = Array.isArray(response)
        ? response
        : response.rows || [];

      setBalances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter visible rows
  const visibleBalances = balances.filter((b: CurrencyBalance) => {
    const hasTransactions = ["purchases", "exchangeBuy", "exchangeSell", "sales", "deposits"].some(
      (field) => parseFloat(b[field as keyof CurrencyBalance] || "0") !== 0
    );

    const hasOpening = parseFloat(b.openingBalance || "0") !== 0;

    return hasOpening || hasTransactions;
  });

  // ✅ Fetch on first load
  useEffect(() => {
    fetchBalanceData();
  }, []);

  const handleDepositInput = (currency: string, value: string) => {
    setDepositInputs((prev) => ({
      ...prev,
      [currency]: value,
    }));
  };

  const handleSaveDeposit = async (currencyType: string) => {
    const amountStr = depositInputs[currencyType] || "";
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid deposit amount");
      return;
    }

    try {
      const res = await fetch("/api/balance-statement/update-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currencyType,
          date: toDate,
          amount,
        }),
      });

      if (!res.ok) {
        console.error("Server error:", await res.text());
        return;
      }

      setDepositInputs((prev) => ({ ...prev, [currencyType]: "" }));

      await fetchBalanceData();
    } catch (err) {
      console.error("Error saving deposit:", err);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-medium)]">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <CardTitle className="text-2xl">Balance Statement</CardTitle>
        <p className="text-sm opacity-90">Multi-Currency Inventory Dashboard</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">

        {/* ✅ Reusable Date Filter */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          loading={loading}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onFilter={fetchBalanceData}
        />

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Currency Type</TableHead>
                  <TableHead className="text-right">Opening Balance (a)</TableHead>
                  <TableHead className="text-right">Purchases (b)</TableHead>
                  <TableHead className="text-right">Exchange-Buy (c)</TableHead>
                  <TableHead className="text-right">Exchange-Sell (d)</TableHead>
                  <TableHead className="text-right">Sales (e)</TableHead>
                  <TableHead className="text-right">Deposits (f)</TableHead>
                  <TableHead className="text-right font-semibold">Closing Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleBalances.map((balance, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {balance.currencyType}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-mono">{balance.openingBalance}</TableCell>
                    <TableCell className="text-right font-mono text-accent">{balance.purchases}</TableCell>
                    <TableCell className="text-right font-mono text-accent">{balance.exchangeBuy}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{balance.exchangeSell}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{balance.sales}</TableCell>

                    {/* ✅ Deposit + Save */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 w-full">
                        <Input
                          type="number"
                          value={depositInputs[balance.currencyType] || ""}
                          onChange={(e) =>
                            handleDepositInput(balance.currencyType, e.target.value)
                          }
                          className="text-right font-mono w-24"
                        />

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveDeposit(balance.currencyType)}
                        >
                          Save
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-primary">
                      {balance.closingBalance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-accent to-accent/90">
            Download Report
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Closing Balance Formula:</span> (a) + (b) + (c) - (d) - (e) - (f)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
