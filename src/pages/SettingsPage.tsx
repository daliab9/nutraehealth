import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [carbsGoal, setCarbsGoal] = useState(250);
  const [fatGoal, setFatGoal] = useState(65);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setCalorieGoal(profile.daily_calorie_goal);
      setProteinGoal(profile.daily_protein_goal);
      setCarbsGoal(profile.daily_carbs_goal);
      setFatGoal(profile.daily_fat_goal);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        daily_calorie_goal: calorieGoal,
        daily_protein_goal: proteinGoal,
        daily_carbs_goal: carbsGoal,
        daily_fat_goal: fatGoal,
      });
      toast({ title: "Settings saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="space-y-4 px-5">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Daily Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Calorie goal (kcal)</Label>
              <Input type="number" value={calorieGoal} onChange={(e) => setCalorieGoal(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Protein (g)</Label>
                <Input type="number" value={proteinGoal} onChange={(e) => setProteinGoal(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Carbs (g)</Label>
                <Input type="number" value={carbsGoal} onChange={(e) => setCarbsGoal(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fat (g)</Label>
                <Input type="number" value={fatGoal} onChange={(e) => setFatGoal(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full gap-2" onClick={handleSave} disabled={updateProfile.isPending}>
          <Save className="h-4 w-4" /> Save settings
        </Button>

        <Button variant="outline" className="w-full gap-2 text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
