import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pricing: any) => void;
  pricing?: any;
}

export function PricingModal({ isOpen, onClose, onSave, pricing }: PricingModalProps) {
  const [formData, setFormData] = useState({
    category: "",
    item_name: "",
    base_price: 0,
    price_per_unit: 0,
    minimum_quantity: 1,
    maximum_quantity: 100,
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (pricing) {
      setFormData({
        category: pricing.category || "",
        item_name: pricing.item_name || "",
        base_price: pricing.base_price || 0,
        price_per_unit: pricing.price_per_unit || 0,
        minimum_quantity: pricing.minimum_quantity || 1,
        maximum_quantity: pricing.maximum_quantity || 100,
        description: pricing.description || "",
        is_active: pricing.is_active !== undefined ? pricing.is_active : true,
      });
    } else {
      setFormData({
        category: "",
        item_name: "",
        base_price: 0,
        price_per_unit: 0,
        minimum_quantity: 1,
        maximum_quantity: 100,
        description: "",
        is_active: true,
      });
    }
  }, [pricing, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pricing ? "Edit Custom Pricing" : "Add Custom Pricing"}
          </DialogTitle>
          <DialogDescription>
            Configure pricing for custom order items
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medals">Medals</SelectItem>
                  <SelectItem value="levels">Levels</SelectItem>
                  <SelectItem value="samples">Samples</SelectItem>
                  <SelectItem value="super_credits">Super Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => handleInputChange("item_name", e.target.value)}
                placeholder="e.g., Medal, Level"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price ($)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => handleInputChange("base_price", parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_unit">Price per Unit ($)</Label>
              <Input
                id="price_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_unit}
                onChange={(e) => handleInputChange("price_per_unit", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
              <Input
                id="minimum_quantity"
                type="number"
                min="1"
                value={formData.minimum_quantity}
                onChange={(e) => handleInputChange("minimum_quantity", parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximum_quantity">Maximum Quantity</Label>
              <Input
                id="maximum_quantity"
                type="number"
                min="1"
                value={formData.maximum_quantity}
                onChange={(e) => handleInputChange("maximum_quantity", parseInt(e.target.value) || 100)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this item provides..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {pricing ? "Update Pricing" : "Add Pricing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
