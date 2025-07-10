
"use client";

import { useState, useMemo, type ChangeEvent, useRef } from "react";
import {
  Trash2,
  Plus,
  Users,
  ReceiptText,
  Upload,
  Sparkles,
  Loader2,
  ChevronDown,
  Download,
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
import { analyzeReceiptImage } from "@/ai/flows/analyze-receipt-image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toJpeg } from 'html-to-image';


type Item = {
  id: string;
  name: string;
  price: number;
  consumers: string[];
};

type Person = string;
type DiscountType = 'fixed' | 'percentage';

export default function BillSplitter() {
  const [people, setPeople] = useState<Person[]>(["Anda"]);
  const [items, setItems] = useState<Item[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [newPersonName, setNewPersonName] = useState("");
  const { toast } = useToast();

  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);


  const handleAddPerson = () => {
    if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName("");
    } else {
      toast({
        variant: "destructive",
        title: "Nama Tidak Valid",
        description: "Harap masukkan nama yang unik.",
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
        title: "Tipe File Tidak Valid",
        description: "Harap unggah file gambar.",
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
                title: "Struk Dianalisis",
                description: `${newItems.length} item telah ditambahkan ke tagihan Anda.`,
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Kesalahan AI",
                description: "Gagal menganalisis struk. Harap tambahkan item secara manual.",
            });
        } finally {
            setIsAnalyzing(false);
        }
      };
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Gagal Membaca File",
            description: "Tidak dapat membaca file yang dipilih.",
        });
        setIsAnalyzing(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!summaryRef.current) {
        toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Tidak dapat menemukan konten ringkasan." });
        return;
    }
    try {
        const dataUrl = await toJpeg(summaryRef.current, { quality: 0.95, backgroundColor: 'white' });
        const link = document.createElement('a');
        link.download = 'ringkasan-tagihan.jpeg';
        link.href = dataUrl;
        link.click();
        toast({ title: "Berhasil Disimpan", description: "Ringkasan tagihan telah diunduh." });
    } catch (err) {
        toast({ variant: "destructive", title: "Gagal Menyimpan Gambar", description: "Terjadi kesalahan saat membuat file gambar." });
        console.error('oops, something went wrong!', err);
    }
  };


  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.price || 0), 0);
    
    // Calculate total discount amount
    let totalDiscountAmount = 0;
    if (discountType === 'fixed') {
        totalDiscountAmount = Number(discountValue) || 0;
    } else { // percentage
        const calculatedDiscount = subtotal * (Number(discountValue) || 0) / 100;
        const max = Number(maxDiscount) || 0;
        totalDiscountAmount = max > 0 ? Math.min(calculatedDiscount, max) : calculatedDiscount;
    }

    // Calculate total tax amount based on subtotal
    const totalTaxAmount = subtotal * (Number(taxPercent) || 0) / 100;
    
    const personShareOfOtherCosts = people.length > 0 ? ((Number(additionalCharges) || 0) + (Number(shippingCost) || 0)) / people.length : 0;

    // Calculate each person's subtotal from items
    const personSubtotals: Record<Person, number> = {};
    people.forEach((person) => (personSubtotals[person] = 0));

    items.forEach((item) => {
      const price = Number(item.price || 0);
      const consumers = item.consumers.length > 0 ? item.consumers : people;
      const share = price / consumers.length;
      consumers.forEach((person) => {
        if (personSubtotals[person] !== undefined) {
          personSubtotals[person] += share;
        }
      });
    });

    // Calculate final individual totals
    const individualTotals: Record<Person, number> = {};
    people.forEach((person) => {
        const pSubtotal = personSubtotals[person];
        const proportion = subtotal > 0 ? pSubtotal / subtotal : 0;

        // Distribute tax and discount proportionally
        const personTax = totalTaxAmount * proportion;
        const personDiscount = totalDiscountAmount * proportion;

        individualTotals[person] = pSubtotal + personTax - personDiscount + personShareOfOtherCosts;
    });
    
    const grandTotal = Object.values(individualTotals).reduce((acc, total) => acc + total, 0);

    return { 
        subtotal, 
        grandTotal, 
        individualTotals, 
        taxAmount: totalTaxAmount, 
        discountAmount: totalDiscountAmount,
        personShareOfOtherCosts
    };
  }, [items, people, taxPercent, additionalCharges, shippingCost, discountType, discountValue, maxDiscount]);
  
  const personItems = useMemo(() => {
    const personItemsMap: Record<Person, {name: string, price: number}[]> = {};
    people.forEach(person => {
      personItemsMap[person] = [];
      items.forEach(item => {
        const consumers = item.consumers.length > 0 ? item.consumers : people;
        if (consumers.includes(person)) {
          personItemsMap[person].push({
            name: item.name,
            price: (Number(item.price) || 0) / consumers.length,
          });
        }
      });
    });
    return personItemsMap;
  }, [items, people]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary" />
              Peserta
            </CardTitle>
            <CardDescription>
              Tambahkan semua orang yang terlibat dalam tagihan ini.
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
                  {person !== "Anda" && (
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
              placeholder="Tambahkan nama teman"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
            />
            <Button onClick={handleAddPerson} aria-label="Tambah Orang">
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
                        Item Tagihan
                    </CardTitle>
                    <CardDescription>
                        Unggah struk atau tambahkan item secara manual.
                    </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="flex-1">
                      <Label>
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Unggah
                        <Input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={isAnalyzing}/>
                      </Label>
                    </Button>
                    <Button onClick={handleAddItem} className="flex-1">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Item
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {items.length === 0 && !isAnalyzing && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Belum ada item.</p>
                        <p className="text-sm">Tambahkan item atau unggah struk untuk memulai.</p>
                    </div>
                )}
                {isAnalyzing && items.length === 0 && (
                    <div className="flex justify-center items-center py-8 text-muted-foreground">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
                        <p>AI sedang menganalisis struk Anda...</p>
                    </div>
                )}
                {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-2 transition-all duration-300">
                        <Input
                            placeholder="Nama Item"
                            value={item.name}
                            onChange={(e) =>
                            handleUpdateItem(item.id, "name", e.target.value)
                            }
                            className="flex-grow"
                        />
                        <Input
                            type="number"
                            placeholder="Harga"
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
                                        ? "Bagi rata untuk semua"
                                        : item.consumers.length === 1
                                        ? item.consumers[0]
                                        : `${item.consumers.length} orang`}
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
                            aria-label="Hapus item"
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
                    <CardTitle>Ringkasan</CardTitle>
                    <CardDescription>Rincian akhir dari pembagian tagihan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{totals.subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tax">Pajak (%)</Label>
                        <Input
                            id="tax"
                            type="number"
                            placeholder="10"
                            value={taxPercent || ""}
                            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Diskon</Label>
                        <Tabs value={discountType} onValueChange={(value) => setDiscountType(value as DiscountType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="fixed">Tetap (IDR)</TabsTrigger>
                                <TabsTrigger value="percentage">Persen (%)</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Input
                            type="number"
                            placeholder="Contoh: 10000 atau 25000"
                            value={discountValue || ""}
                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                            min="0"
                        />
                        {discountType === 'percentage' && (
                            <div className="space-y-2">
                                <Label htmlFor="max-discount">Maksimal Diskon (IDR)</Label>
                                <Input
                                    id="max-discount"
                                    type="number"
                                    placeholder="Contoh: 50000"
                                    value={maxDiscount || ""}
                                    onChange={(e) => setMaxDiscount(parseFloat(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        )}
                    </div>
                    
                     <div className="space-y-2">
                        <Label htmlFor="additional-charges">Biaya Tambahan</Label>
                        <Input
                            id="additional-charges"
                            type="number"
                            placeholder="0"
                            value={additionalCharges || ""}
                            onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                             min="0"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shipping-cost">Ongkos Kirim</Label>
                        <Input
                            id="shipping-cost"
                            type="number"
                            placeholder="0"
                            value={shippingCost || ""}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                    
                    <Separator />

                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pajak</span>
                        <span>{totals.taxAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span className="text-muted-foreground">Diskon</span>
                        <span>- {totals.discountAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Biaya lain-lain</span>
                        <span>{(Number(additionalCharges) + Number(shippingCost)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                    </div>

                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{totals.grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold">Total per Orang</h4>
                        {people.map((person) => (
                        <div key={person} className="flex justify-between">
                            <span className="text-muted-foreground">{person}</span>
                            <span className="font-medium">{totals.individualTotals[person]?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                        </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button onClick={() => setShowSummaryModal(true)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        Lihat Ringkasan Pembagian
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
       <AlertDialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <ReceiptText className="text-accent" />
                Ringkasan Pembagian Tagihan
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div ref={summaryRef} className="bg-white p-4 rounded-md">
            <div className="space-y-4 text-black">
                <h3 className="text-lg font-bold text-center">Rincian Tagihan</h3>
                 <Separator className="bg-gray-300" />
                 <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL TAGIHAN</span>
                    <span>{totals.grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                </div>
                 <Separator className="bg-gray-300"/>
                 <div>
                    <h4 className="font-semibold mb-2 text-center">Pembagian per Orang</h4>
                    <div className="space-y-4">
                      {people.map((person) => (
                        <div key={person} className="p-2 rounded-md bg-gray-100">
                          <div className="flex justify-between font-bold">
                            <span>{person}</span>
                            <span>{totals.individualTotals[person]?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                          </div>
                          <Separator className="my-2 bg-gray-200" />
                          <div className="space-y-1 text-sm">
                            {personItems[person].map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-gray-600">{item.name}</span>
                                <span className="text-gray-800">{item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                              </div>
                            ))}
                             {(additionalCharges > 0 || shippingCost > 0) && (
                                <>
                                  <Separator className="my-1 bg-gray-200" />
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Biaya Lainnya</span>
                                    <span className="text-gray-800">{totals.personShareOfOtherCosts.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                                  </div>
                                </>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
                 <Separator className="bg-gray-300"/>
                 <div className="text-xs text-gray-500 pt-2 space-y-1">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>{totals.subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
                    <div className="flex justify-between"><span>Pajak ({taxPercent}%):</span> <span>{totals.taxAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
                    {discountValue > 0 && <div className="flex justify-between"><span>Diskon:</span> <span>-{totals.discountAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>}
                    {additionalCharges > 0 && <div className="flex justify-between"><span>Biaya Tambahan:</span> <span>{Number(additionalCharges).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>}
                    {shippingCost > 0 && <div className="flex justify-between"><span>Ongkos Kirim:</span> <span>{Number(shippingCost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>}
                 </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveSummary}><Download className="mr-2 h-4 w-4" /> Simpan sebagai JPEG</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

