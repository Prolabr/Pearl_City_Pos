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
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Calendar } from "lucide-react";

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

export const BalanceStatement = () => {
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch balance data and compute closing balance
 const fetchBalanceData = async () => {
  try {
    setLoading(true);

    const res = await fetch(
      `/api/balance-statement?fromDate=${fromDate}&toDate=${toDate}`
    );

    if (!res.ok) throw new Error("Failed to fetch balance data");

    const response = await res.json();

    // ✅ Accept API returning array OR object with { rows }
    const data: CurrencyBalance[] = Array.isArray(response)
      ? response
      : response.rows || [];

    if (!Array.isArray(data)) {
      console.error("Invalid balance response:", response);
      setBalances([]);
      return;
    }

    // ✅ Compute closing balance
    const updatedData = data.map((b) => {
      const closing =
        parseFloat(b.openingBalance || "0") +
        parseFloat(b.purchases || "0") +
        parseFloat(b.exchangeBuy || "0") -
        parseFloat(b.exchangeSell || "0") -
        parseFloat(b.sales || "0") -
        parseFloat(b.deposits || "0");

      return { ...b, closingBalance: closing.toFixed(2) };
    });

    // ✅ Filter visible rows
    const visibleBalances = updatedData.filter((b) => {
      const hasTransactions = [
        "purchases",
        "exchangeBuy",
        "exchangeSell",
        "sales",
        "deposits",
      ].some(
        (field) => parseFloat(b[field as keyof CurrencyBalance] || "0") !== 0
      );
      const hasOpening = parseFloat(b.openingBalance || "0") !== 0;
      return hasOpening || hasTransactions;
    });

    setBalances(visibleBalances);
  } catch (err) {
    console.error("Error fetching balances:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchBalanceData();
  }, []);

  const handleDepositChange = (index: number, newValue: string) => {
    setBalances((prev) =>
      prev.map((b, i) => {
        if (i === index) {
          const updated = { ...b, deposits: newValue };

          const closing =
            parseFloat(updated.openingBalance || "0") +
            parseFloat(updated.purchases || "0") +
            parseFloat(updated.exchangeBuy || "0") -
            parseFloat(updated.exchangeSell || "0") -
            parseFloat(updated.sales || "0") -
            parseFloat(updated.deposits || "0");

          return {
            ...updated,
            closingBalance: closing.toFixed(2),
          };
        }
        return b;
      })
    );
  };

const handleSaveDeposit = async (index: number) => {
  const row = balances[index];

  try {
    const res = await fetch("/api/balance-statement/update-deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyType: row.currencyType,
        date: toDate,  // ✅ REQUIRED by backend
        deposits: parseFloat(row.deposits || "0")
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Server error:", error);
      throw new Error("Failed to save deposit");
    }

    // Refresh table after saving
    await fetchBalanceData();
  } catch (err) {
    console.error("Error saving:", err);
  }
};

  return (
    <Card className="shadow-[var(--shadow-medium)]">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <CardTitle className="text-2xl">Balance Statement</CardTitle>
        <p className="text-sm opacity-90">Multi-Currency Inventory Dashboard</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="fromDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              From Date
            </Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              To Date
            </Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchBalanceData}
              className="w-full bg-gradient-to-r from-accent to-accent/90"
            >
              {loading ? "Loading..." : "Filter"}
            </Button>
          </div>
        </div>

        {/* Balance Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Currency Type</TableHead>
                  <TableHead className="text-right">Opening Balance(a)</TableHead>
                  <TableHead className="text-right">Purchases (b)</TableHead>
                  <TableHead className="text-right">Exchange-Buy (c)</TableHead>
                  <TableHead className="text-right">
                    Exchange-Sell (d)
                  </TableHead>
                  <TableHead className="text-right">Sales (e)</TableHead>
                  <TableHead className="text-right">
                    Deposits to the Authorized Dealer(f)
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Closing Balance
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {balances.map((balance, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {balance.currencyType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {balance.openingBalance}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {balance.purchases}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {balance.exchangeBuy}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {balance.exchangeSell}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {balance.sales}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 w-full">
                        <Input
                          type="number"
                          value={balance.deposits}
                          onChange={(e) =>
                            handleDepositChange(index, e.target.value)
                          }
                          className="text-right font-mono w-24"
                        />

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveDeposit(index)}
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
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-accent to-accent/90"
          >
            Download Report
          </Button>
        </div>

        {/* Formula Note */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Closing Balance Formula:</span> (a)
            + (b) + (c) - (d) - (e) - (f)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
