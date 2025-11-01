import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";

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
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const [balances, setBalances] = useState<CurrencyBalance[]>([
    {
      currencyType: "USD",
      openingBalance: "15000.00",
      purchases: "5000.00",
      exchangeBuy: "0.00",
      exchangeSell: "0.00",
      sales: "0.00",
      deposits: "3000.00",
      closingBalance: "9500.00",
    },
  ]);


  // Helper to calculate totals dynamically
  const calculateTotal = (field: keyof CurrencyBalance) => {
    return balances
      .reduce((sum, balance) => sum + parseFloat(balance[field] || "0"), 0)
      .toFixed(2);
  };

  const fetchBalanceData = async () => {
  const res = await fetch(
    `/api/balance-statement?fromDate=${fromDate}&toDate=${toDate}`
  );
  const data = await res.json();
  setBalances(data);
};


  // Function to recompute closing balance
  const computeClosingBalance = (b: CurrencyBalance) => {
    const closing =
      parseFloat(b.openingBalance || "0") +
      parseFloat(b.purchases || "0") +
      parseFloat(b.exchangeBuy || "0") -
      parseFloat(b.exchangeSell || "0") -
      parseFloat(b.sales || "0") -
      parseFloat(b.deposits || "0");
    return closing.toFixed(2);
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
            <Button onClick={fetchBalanceData} className="w-full bg-gradient-to-r from-accent to-accent/90">
              Generate Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-accent mb-2">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm font-medium">Total Opening Balance</p>
            </div>
            <p className="text-2xl font-bold">{calculateTotal("openingBalance")}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="h-5 w-5" />
              <p className="text-sm font-medium">Total Purchases</p>
            </div>
            <p className="text-2xl font-bold">{calculateTotal("purchases")}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-accent mb-2">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm font-medium">Total Closing Balance</p>
            </div>
            <p className="text-2xl font-bold">{calculateTotal("closingBalance")}</p>
          </div>
        </div>

        {/* Balance Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Currency</TableHead>
                  <TableHead className="text-right">Opening Balance (a)</TableHead>
                  <TableHead className="text-right">Purchases (b)</TableHead>
                  <TableHead className="text-right">Exchange-Buy (c)</TableHead>
                  <TableHead className="text-right">Exchange-Sell (d)</TableHead>
                  <TableHead className="text-right">Sales (e)</TableHead>
                  <TableHead className="text-right">Deposits/Sales (f)</TableHead>
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
                    <TableCell className="text-right font-mono">{balance.openingBalance}</TableCell>
                    <TableCell className="text-right font-mono text-accent">{balance.purchases}</TableCell>
                    <TableCell className="text-right font-mono text-accent">{balance.exchangeBuy}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{balance.exchangeSell}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{balance.sales}</TableCell>

                    {/* Editable Deposits Input */}
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={balance.deposits}
                        onChange={(e) => {
                          const newDeposits = e.target.value;
                          setBalances((prev) =>
                            prev.map((b, i) => {
                              if (i === index) {
                                const updated = { ...b, deposits: newDeposits };
                                return {
                                  ...updated,
                                  closingBalance: computeClosingBalance(updated),
                                };
                              }
                              return b;
                            })
                          );
                        }}
                        className="text-right font-mono w-24"
                      />
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-primary">
                      {balance.closingBalance}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">{calculateTotal("openingBalance")}</TableCell>
                  <TableCell className="text-right font-mono text-accent">{calculateTotal("purchases")}</TableCell>
                  <TableCell className="text-right font-mono text-accent">{calculateTotal("exchangeBuy")}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{calculateTotal("exchangeSell")}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{calculateTotal("sales")}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{calculateTotal("deposits")}</TableCell>
                  <TableCell className="text-right font-mono text-primary">{calculateTotal("closingBalance")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Formula Note */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Closing Balance Formula:</span> (a) + (b) + (c) - (d) - (e) - (f)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
