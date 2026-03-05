import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { FoodItem } from "@/stores/useUserStore";

interface ScannedItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string;
}

interface AIScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: FoodItem[]) => void;
  mealTitle: string;
}

export const AIScanDialog = ({ open, onOpenChange, onAddItems, mealTitle }: AIScanDialogProps) => {
  const [step, setStep] = useState<"capture" | "analyzing" | "review" | "error">("capture");
  const [preview, setPreview] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [editingItems, setEditingItems] = useState<ScannedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("capture");
    setPreview(null);
    setScannedItems([]);
    setEditingItems([]);
    setErrorMsg("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const processImage = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setStep("analyzing");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-meal", {
        body: { image: base64, mimeType: file.type },
      });

      if (error) {
        throw new Error(error.message || "Analysis failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.items || data.items.length === 0) {
        throw new Error("No food items detected in the image");
      }

      setScannedItems(data.items);
      setEditingItems(data.items.map((item: ScannedItem) => ({ ...item })));
      setStep("review");
    } catch (e) {
      console.error("Scan error:", e);
      setErrorMsg(e instanceof Error ? e.message : "Failed to analyze image");
      setStep("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const updateItem = (index: number, field: keyof ScannedItem, value: string | number) => {
    setEditingItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setEditingItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const foodItems: FoodItem[] = editingItems.map((item) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: item.name,
      calories: Number(item.calories),
      protein: Number(item.protein),
      carbs: Number(item.carbs),
      fat: Number(item.fat),
      quantity: item.quantity,
    }));
    onAddItems(foodItems);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "capture" && "Scan your meal"}
            {step === "analyzing" && "Analyzing..."}
            {step === "review" && "Review items"}
            {step === "error" && "Scan failed"}
          </DialogTitle>
        </DialogHeader>

        {step === "capture" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Take a photo or upload an image of your meal and AI will identify the foods and estimate nutrition.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 h-24 rounded-2xl flex-col gap-2"
                variant="outline"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Camera</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-24 rounded-2xl flex-col gap-2"
                variant="outline"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload</span>
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            {preview && (
              <img
                src={preview}
                alt="Meal"
                className="w-40 h-40 object-cover rounded-2xl"
              />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Identifying food items...</p>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-center text-muted-foreground">{errorMsg}</p>
            <Button onClick={reset} variant="outline" className="rounded-xl">
              Try again
            </Button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4 pt-2">
            {preview && (
              <img
                src={preview}
                alt="Meal"
                className="w-full h-32 object-cover rounded-xl"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Review and edit the AI estimates before adding to {mealTitle}.
            </p>
            <div className="space-y-3">
              {editingItems.map((item, i) => (
                <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="rounded-lg text-sm font-medium border-0 p-0 h-auto focus-visible:ring-0"
                    />
                    <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.quantity}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Calories</label>
                      <Input
                        type="number"
                        value={item.calories}
                        onChange={(e) => updateItem(i, "calories", Number(e.target.value))}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Protein</label>
                      <Input
                        type="number"
                        value={item.protein}
                        onChange={(e) => updateItem(i, "protein", Number(e.target.value))}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Carbs</label>
                      <Input
                        type="number"
                        value={item.carbs}
                        onChange={(e) => updateItem(i, "carbs", Number(e.target.value))}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Fat</label>
                      <Input
                        type="number"
                        value={item.fat}
                        onChange={(e) => updateItem(i, "fat", Number(e.target.value))}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {editingItems.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{editingItems.reduce((s, i) => s + Number(i.calories), 0)} kcal</span>
                </div>
              </div>
            )}
            <Button
              onClick={handleConfirm}
              className="w-full rounded-xl h-12"
              disabled={editingItems.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Add {editingItems.length} item{editingItems.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
