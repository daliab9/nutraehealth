import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Check, X, AlertTriangle, Plus, ImagePlus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import type { FoodItem } from "@/stores/useUserStore";

interface ScannedItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  iron?: number;
  vitamin_d?: number;
  magnesium?: number;
  omega3?: number;
  b12?: number;
  quantity: string;
}

interface AIScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: FoodItem[]) => void;
  mealTitle: string;
}

export const AIScanDialog = ({ open, onOpenChange, onAddItems, mealTitle }: AIScanDialogProps) => {
  const [step, setStep] = useState<"capture" | "preview" | "analyzing" | "review" | "error">("capture");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [editingItems, setEditingItems] = useState<ScannedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const addMoreCameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("capture");
    setSelectedFiles([]);
    setPreviews([]);
    setScannedItems([]);
    setEditingItems([]);
    setErrorMsg("");
    setShowManualAdd(false);
    resetManualForm();
  };

  const resetManualForm = () => {
    setManualName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setManualQuantity("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addFiles = (files: File[]) => {
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    setStep("preview");
  };

  const removePhoto = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    if (newFiles.length === 0) setStep("capture");
  };

  const handleAnalyze = async () => {
    setStep("analyzing");
    try {
      const images = await Promise.all(
        selectedFiles.map(async (file) => ({
          base64: await fileToBase64(file),
          mimeType: file.type,
        }))
      );

      const { data, error } = await supabase.functions.invoke("analyze-meal", {
        body: { images },
      });

      if (error) throw new Error(error.message || "Analysis failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.items || data.items.length === 0) throw new Error("No food items detected in the images");

      setScannedItems(data.items);
      setEditingItems(data.items.map((item: ScannedItem) => ({ ...item })));
      setStep("review");
    } catch (e) {
      console.error("Scan error:", e);
      setErrorMsg(e instanceof Error ? e.message : "Failed to analyze images");
      setStep("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) addFiles(Array.from(files));
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

  const handleAddManualItem = () => {
    if (!manualName.trim()) return;
    const newItem: ScannedItem = {
      name: manualName.trim(),
      calories: Number(manualCalories) || 0,
      protein: Number(manualProtein) || 0,
      carbs: Number(manualCarbs) || 0,
      fat: Number(manualFat) || 0,
      quantity: manualQuantity.trim() || "1 serving",
    };
    setEditingItems((prev) => [...prev, newItem]);
    resetManualForm();
    setShowManualAdd(false);
  };

  const handleConfirm = () => {
    const foodItems: FoodItem[] = editingItems.map((item) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: item.name,
      calories: Number(item.calories),
      protein: Number(item.protein),
      carbs: Number(item.carbs),
      fat: Number(item.fat),
      fiber: item.fiber,
      iron: item.iron,
      vitamin_d: item.vitamin_d,
      magnesium: item.magnesium,
      omega3: item.omega3,
      b12: item.b12,
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
            {step === "preview" && "Your photos"}
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
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Review your photo{previews.length !== 1 ? "s" : ""}. Add more or proceed to analyze.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => addMoreCameraRef.current?.click()}
                variant="outline"
                className="flex-1 rounded-xl gap-2 text-sm"
              >
                <Camera className="h-4 w-4" />
                Add photo
              </Button>
              <Button
                onClick={() => addMoreInputRef.current?.click()}
                variant="outline"
                className="flex-1 rounded-xl gap-2 text-sm"
              >
                <ImagePlus className="h-4 w-4" />
                Upload more
              </Button>
            </div>

            <Button
              onClick={handleAnalyze}
              className="w-full rounded-xl h-12"
            >
              <Check className="h-4 w-4 mr-2" />
              Analyze {previews.length} photo{previews.length !== 1 ? "s" : ""}
            </Button>

            <input
              ref={addMoreCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={addMoreInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto w-full justify-center">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={`Meal ${i + 1}`} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Identifying food items from {previews.length} photo{previews.length !== 1 ? "s" : ""}...</p>
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
            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={`Meal ${i + 1}`} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
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

            {showManualAdd ? (
              <div className="rounded-xl border border-border p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Search & add food</p>
                  <button onClick={() => setShowManualAdd(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FoodSearchInput
                  onAddItem={(item) => {
                    const scannedItem: ScannedItem = {
                      name: item.name,
                      calories: item.calories,
                      protein: item.protein,
                      carbs: item.carbs,
                      fat: item.fat,
                      fiber: item.fiber,
                      iron: item.iron,
                      vitamin_d: item.vitamin_d,
                      magnesium: item.magnesium,
                      omega3: item.omega3,
                      b12: item.b12,
                      quantity: item.quantity || "1 serving",
                    };
                    setEditingItems((prev) => [...prev, scannedItem]);
                    setShowManualAdd(false);
                  }}
                  onClose={() => setShowManualAdd(false)}
                  keepOpenOnAdd
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-xl h-10 text-sm gap-2"
                onClick={() => setShowManualAdd(true)}
              >
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            )}

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