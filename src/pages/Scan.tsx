import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useCreateMeal } from "@/hooks/useMeals";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Plus, Loader2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string;
}

const Scan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createMeal = useCreateMeal();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const { data, error } = await supabase.functions.invoke("analyze-meal", {
          body: { image: base64, mimeType: file.type },
        });

        if (error) throw error;

        if (data.items) {
          setItems(data.items);
          setMealName(data.mealName || "Meal");
        }
      };
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze the image. Try manual entry.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addManualItem = () => {
    setItems([...items, { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, quantity: "1 serving" }]);
    setShowManual(true);
  };

  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
  const totalFat = items.reduce((s, i) => s + i.fat, 0);

  const handleSave = async () => {
    if (items.length === 0) {
      toast({ title: "Add at least one food item", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | undefined;

      if (imageFile && user) {
        const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("meal-photos")
          .upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      await createMeal.mutateAsync({
        meal: {
          name: mealName || "Meal",
          photo_url: photoUrl,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
          meal_type: mealType || undefined,
        },
        items,
      });

      toast({ title: "Meal saved!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error saving meal", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Add Meal</h1>
        <p className="text-sm text-muted-foreground">Snap a photo or add items manually</p>
      </div>

      {/* Image capture area */}
      <div className="px-5">
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-2xl">
            <img src={imagePreview} alt="Meal" className="w-full h-48 object-cover" />
            <button
              onClick={() => { setImagePreview(null); setImageFile(null); }}
              className="absolute top-2 right-2 rounded-full bg-foreground/60 p-1.5"
            >
              <X className="h-4 w-4 text-background" />
            </button>
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">Analyzing meal...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/50 py-12 transition-colors hover:border-primary/50 hover:bg-secondary"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Take or upload a photo</p>
              <p className="text-xs text-muted-foreground">AI will identify food items</p>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      {/* Meal details */}
      <div className="mt-4 space-y-4 px-5">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Meal name</Label>
            <Input
              placeholder="e.g. Lunch"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
          </div>
          <div className="w-32 space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Food items */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">Food Items</h3>
            {items.map((item, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      placeholder="Food item name"
                      className="text-sm font-medium"
                    />
                    <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Calories</Label>
                      <Input
                        type="number"
                        value={item.calories}
                        onChange={(e) => updateItem(i, "calories", Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Protein</Label>
                      <Input
                        type="number"
                        value={item.protein}
                        onChange={(e) => updateItem(i, "protein", Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Carbs</Label>
                      <Input
                        type="number"
                        value={item.carbs}
                        onChange={(e) => updateItem(i, "carbs", Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Fat</Label>
                      <Input
                        type="number"
                        value={item.fat}
                        onChange={(e) => updateItem(i, "fat", Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full gap-1" onClick={addManualItem}>
          <Plus className="h-4 w-4" /> Add item manually
        </Button>

        {/* Summary */}
        {items.length > 0 && (
          <Card className="bg-secondary/50 border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="font-display text-lg font-bold text-primary">{totalCalories} kcal</span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Protein: {totalProtein}g</span>
                <span>Carbs: {totalCarbs}g</span>
                <span>Fat: {totalFat}g</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving || items.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? "Saving..." : "Save Meal"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Scan;
