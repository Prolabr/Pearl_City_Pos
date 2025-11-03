import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { toast } from "../hooks/use-toast";
import { Plus, Trash2, Save, FileDown } from "lucide-react";
import { generatePDF, CurrencyRow } from "../components/pdfGenerator";

export const CustomerReceipt = () => {
  const [serialNo, setSerialNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [nicPassport, setNicPassport] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [otherSource, setOtherSource] = useState("");
  const [rows, setRows] = useState<CurrencyRow[]>([]); 

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        currencyType: "",
        amountReceived: "",
        rate: "",
        amountIssued: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CurrencyRow, value: string) => {
    setRows(
      rows.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === "amountReceived" || field === "rate") {
            const amt = parseFloat(updated.amountReceived) || 0;
            const rate = parseFloat(updated.rate) || 0;
            updated.amountIssued = (amt * rate).toFixed(2);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const toggleSource = (key: string) => {
    if (sources.includes(key)) {
      setSources(sources.filter((s) => s !== key));
    } else {
      setSources([...sources, key]);
    }
  };

  const handleSave = async () => {
     try {
    const res = await fetch("/api/customer-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serialNo,
        date,
        customerName,
        nicPassport,
        sources,
        otherSource,
        rows,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    toast({ title: "Receipt Saved", description: data.message });
    // reset form here
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }

  };

  const handleGeneratePDF = () => {
    if (!customerName || !nicPassport || sources.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required customer details.",
        variant: "destructive",
      });
      return;
    }

    generatePDF({
      serialNo,
      date,
      customerName,
      nicPassport,
      sources,
      otherSource,
      rows,
    });
  };

  return (
    <Card className="shadow-[var(--shadow-medium)]">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <CardTitle className="text-2xl">Customer Receipt</CardTitle>
        <p className="text-sm opacity-90">Foreign Currency Sale Transaction</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permitNo">Permit No: DFE/RD/6000</Label>
            <Input
              id="permitNo"
              value="DFE/RD/6000"
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNo">Serial No</Label>
            <Input
              id="serialNo"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Enter serial number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Name of the Customer *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nicPassport">NIC/Passport No *</Label>
            <Input
              id="nicPassport"
              value={nicPassport}
              onChange={(e) => setNicPassport(e.target.value)}
              placeholder="Enter NIC or Passport number"
            />
          </div>
        </div>

        {/* Source of Foreign Currency */}
        <div>
          <Label className="text-base font-semibold">
            Source of Foreign Currency *
          </Label>
          <div className="border border-gray-300 rounded-lg divide-y divide-gray-300">
            {(
              [
                {
                  key: "vacation",
                  label:
                    "a) Persons return for vacation from foreign employment",
                },
                {
                  key: "relatives",
                  label: "b) Relatives of those employees abroad",
                },
                {
                  key: "tourists",
                  label:
                    "c) Foreign tourists (directly or through tour guides)",
                },
                {
                  key: "unutilized",
                  label:
                    "d) Unutilized foreign currency obtained for travel purpose by residents",
                },
                { key: "other", label: "e) Other" },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex justify-between items-center px-3 py-2"
              >
                <span className="text-gray-800 text-sm md:text-base">
                  {item.label}
                </span>
                {item.key === "other" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={otherSource}
                      onChange={(e) => setOtherSource(e.target.value)}
                      placeholder="Specify"
                      className="h-7 w-40 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!sources.includes("other")) toggleSource("other");
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      If other specify
                    </span>
                  </div>
                )}
                <input
                  type="checkbox"
                  checked={sources.includes(item.key)}
                  onChange={() => toggleSource(item.key)}
                  className="appearance-none border-2 border-gray-400 rounded-sm w-12 h-6 checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Currency Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Currency Details</Label>
            <Button onClick={addRow} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Currency
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Currency Type</TableHead>
                  <TableHead>Amount Received (FCY)</TableHead>
                  <TableHead>Rate Offered</TableHead>
                  <TableHead>Amount Issued (LKR)</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Select
                        value={row.currencyType}
                        onValueChange={(value) =>
                          updateRow(row.id, "currencyType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="NZD">NZD</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.amountReceived}
                        onChange={(e) =>
                          updateRow(row.id, "amountReceived", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.rate}
                        onChange={(e) =>
                          updateRow(row.id, "rate", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.amountIssued}
                        readOnly
                        className="bg-muted"
                        placeholder="0.00"
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length < 3 &&
                  [...Array(3 - rows.length)].map((_, index) => (
                    <TableRow key={`empty-${index}`}>
                      <TableCell className="h-10"></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleGeneratePDF}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Generate PDF
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="gap-2 bg-gradient-to-r from-accent to-accent/90"
          >
            <Save className="h-4 w-4" />
            Save Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
