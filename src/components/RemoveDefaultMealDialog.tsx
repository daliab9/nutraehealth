import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RemoveDefaultMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  onRemoveToday: () => void;
  onRemovePermanently: () => void;
}

export const RemoveDefaultMealDialog = ({
  open,
  onOpenChange,
  mealName,
  onRemoveToday,
  onRemovePermanently,
}: RemoveDefaultMealDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove "{mealName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full rounded-xl h-12"
            onClick={() => {
              onRemoveToday();
              onOpenChange(false);
            }}
          >
            Remove just for today
          </Button>
          <Button
            variant="destructive"
            className="w-full rounded-xl h-12"
            onClick={() => {
              onRemovePermanently();
              onOpenChange(false);
            }}
          >
            Remove permanently
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
