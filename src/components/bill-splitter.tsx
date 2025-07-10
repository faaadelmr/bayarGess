"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import {
  Trash2,
  Plus,
  Users,
  ReceiptText,
  Upload,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { analyzeReceiptImage, type AnalyzeReceiptImageOutput } from "@/ai/flows/analyze-receipt-image";
import { suggestEquitableSplits, type SuggestEquitableSplitsInput, type SuggestEquitableSplitsOutput } from "@/ai/flows/suggest-equitable-splits";


type Item = {
  id: string;
  name: string;
  price: number;
  consumers: string[];
};

type Person = string;

export default function BillSplitter() {
  const [people, setPeople] = useState<Person[]>(["You"]);
  const [items, setItems] = useState<Item[]>([]);
  const [tax, setTax] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [newPersonName, setNewPersonName] = useState("");
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestEquitableSplitsOutput | null>(null);

  const handleAddPerson = () => {
    if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName("");
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Please enter a unique name.",
      });
    }
  };

  const handleDeletePerson = (personToDelete: Person) => {
    setPeople(people.filter((p) => p !== personToDelete));
    setItems(
      items.map((item) => ({
        ...item,
        consumers: item.consumers.filter((c) => c !== personToDelete),
      }))
    );
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: "",
        price: 0,
        consumers: [],
      },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: "name" | "price",
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleToggleConsumer = (itemId: string, person: Person) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const newConsumers = item.consumers.includes(person)
            ? item.consumers.filter((c) => c !== person)
            : [...item.consumers, person];
          return { ...item, consumers: newConsumers };
        }
        return item;
      })
    );
  };
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file.",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
            const { items: extractedItems } = await analyzeReceiptImage({ receiptDataUri: base64 });
            const newItems: Item[] = extractedItems.map(item => ({...item, id: crypto.randomUUID(), consumers: [] }));
            setItems(prev => [...prev, ...newItems]);
            toast({
                title: "Receipt Analyzed",
                description: `${newItems.length} items have been added to your bill.`,
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "AI Error",
                description: "Failed to analyze receipt. Please add items manually.",
            });
        } finally {
            setIsAnalyzing(false);
        }
      };
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Reading File",
            description: "Could not read the selected file.",
        });
        setIsAnalyzing(false);
    }
  };

  const handleSuggestSplit = async () => {
      if (items.length === 0 || people.length === 0) {
           toast({
                variant: "destructive",
                title: "Not enough data",
                description: "Please add items and participants before suggesting a split.",
            });
            return;
      }

      setIsSuggesting(true);
      try {
        const input: SuggestEquitableSplitsInput = {
            items: items.map(({ id, ...rest }) => rest), // remove id before sending to AI
            people: people
        };
        const result = await suggestEquitableSplits(input);
        setSuggestion(result);
      } catch (error) {
          toast({
                variant: "destructive",
                title: "AI Suggestion Failed",
                description: "Could not generate a split suggestion at this time.",
            });
            setSuggestion(null);
      } finally {
          setIsSuggesting(false);
      }
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.price || 0), 0);
    const otherCosts = (Number(tax) || 0) + (Number(additionalCharges) || 0) + (Number(shippingCost) || 0);
    const grandTotal = subtotal + otherCosts;

    const individualTotals: Record<Person, number> = {};
    people.forEach((person) => (individualTotals[person] = 0));

    items.forEach((item) => {
      const price = Number(item.price || 0);
      const consumers = item.consumers.length > 0 ? item.consumers : people;
      const share = price / consumers.length;
      consumers.forEach((person) => {
        if (individualTotals[person] !== undefined) {
          individualTotals[person] += share;
        }
      });
    });

    people.forEach((person) => {
        const personSubtotal = individualTotals[person];
        const personShareOfOtherCosts = subtotal > 0 ? (personSubtotal / subtotal) * otherCosts : (otherCosts / people.length);
        individualTotals[person] += personShareOfOtherCosts;
    });

    return { subtotal, grandTotal, individualTotals, otherCosts };
  }, [items, people, tax, additionalCharges, shippingCost]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary" />
              Participants
            </CardTitle>
            <CardDescription>
              Add everyone involved in this bill.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {people.map((person) => (
                <div
                  key={person}
                  className="flex items-center justify-between"
                >
                  <p className="font-medium">{person}</p>
                  {person !== "You" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePerson(person)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Input
              placeholder="New person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
            />
            <Button onClick={handleAddPerson} aria-label="Add person">
              <Plus />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="text-primary" />
                        Bill Items
                    </CardTitle>
                    <CardDescription>
                        Upload a receipt or add items manually.
                    </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="flex-1">
                      <Label>
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload
                        <Input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={isAnalyzing}/>
                      </Label>
                    </Button>
                    <Button onClick={handleAddItem} className="flex-1">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {items.length === 0 && !isAnalyzing && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No items yet.</p>
                        <p className="text-sm">Add an item or upload a receipt to get started.</p>
                    </div>
                )}
                {isAnalyzing && items.length === 0 && (
                    <div className="flex justify-center items-center py-8 text-muted-foreground">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
                        <p>AI is analyzing your receipt...</p>
                    </div>
                )}
                {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-2 transition-all duration-300">
                        <Input
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) =>
                            handleUpdateItem(item.id, "name", e.target.value)
                            }
                            className="flex-grow"
                        />
                        <Input
                            type="number"
                            placeholder="Price"
                            value={item.price || ""}
                            onChange={(e) =>
                            handleUpdateItem(
                                item.id,
                                "price",
                                parseFloat(e.target.value) || 0
                            )
                            }
                            className="w-full sm:w-28"
                            min="0"
                            step="0.01"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                                    <span className="truncate flex-1">
                                    {item.consumers.length === 0
                                        ? "Split between all"
                                        : item.consumers.length === 1
                                        ? item.consumers[0]
                                        : `${item.consumers.length} people`}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <div className="space-y-2">
                                    {people.map(p => (
                                        <Label key={p} className="flex items-center space-x-2 font-normal p-2 hover:bg-muted rounded-md cursor-pointer">
                                            <Checkbox 
                                                checked={item.consumers.includes(p)}
                                                onCheckedChange={() => handleToggleConsumer(item.id, p)}
                                            />
                                            <span>{p}</span>
                                        </Label>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label="Delete item"
                        >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>The final breakdown of who owes what.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{totals.subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="tax">Pajak</Label>
                        <Input
                            id="tax"
                            type="number"
                            placeholder="0.00"
                            value={tax || ""}
                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="additional-charges">Biaya Tambahan</Label>
                        <Input
                            id="additional-charges"
                            type="number"
                            placeholder="0.00"
                            value={additionalCharges || ""}
                            onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                             min="0"
                            step="0.01"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shipping-cost">Ongkos Kirim</Label>
                        <Input
                            id="shipping-cost"
                            type="number"
                            placeholder="0.00"
                            value={shippingCost || ""}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                        />
                    </div>
                    
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{totals.grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold">Individual Totals</h4>
                        {people.map((person) => (
                        <div key={person} className="flex justify-between">
                            <span className="text-muted-foreground">{person}</span>
                            <span className="font-medium">{totals.individualTotals[person]?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button onClick={handleSuggestSplit} disabled={isSuggesting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Suggest Equitable Split
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
       <AlertDialog open={!!suggestion} onOpenChange={(open) => !open && setSuggestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                AI-Powered Equitable Split
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suggestion?.explanation}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto p-1">
            <div className="space-y-2">
                {suggestion?.splits.map(split => (
                    <div key={split.person} className="flex justify-between p-2 rounded-md bg-muted/50">
                        <span className="font-medium">{split.person}</span>
                        <span className="font-bold">{split.amountOwed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuggestion(null)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
