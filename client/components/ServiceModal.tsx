import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Service } from "@/hooks/useServices";
import { Plus, Trash2 } from "lucide-react";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, "id" | "createdAt" | "orders">) => void;
  service?: Service | null;
}

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
}: ServiceModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    duration: "",
    difficulty: "",
    features: [""],
    active: true,
    popular: false,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        description: service.description,
        price: service.price.toString(),
        originalPrice: service.originalPrice?.toString() || "",
        duration: service.duration,
        difficulty: service.difficulty,
        features: service.features.length > 0 ? service.features : [""],
        active: service.active,
        popular: service.popular || false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        originalPrice: "",
        duration: "",
        difficulty: "",
        features: [""],
        active: true,
        popular: false,
      });
    }
  }, [service, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.duration ||
      !formData.difficulty
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const serviceData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : undefined,
      duration: formData.duration,
      difficulty: formData.difficulty,
      features: formData.features.filter((feature) => feature.trim() !== ""),
      active: formData.active,
      popular: formData.popular,
    };

    onSave(serviceData);
    onClose();
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? value : feature,
      ),
    }));
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Update the service details below"
              : "Create a new boosting service for your customers"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Level Boost"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trivial">Trivial</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Extreme">Extreme</SelectItem>
                  <SelectItem value="Helldive">Helldive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what this service includes..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="29.99"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (Optional)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    originalPrice: e.target.value,
                  }))
                }
                placeholder="39.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="1-3 days"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button
                type="button"
                onClick={addFeature}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>

            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="e.g., Level 1-50"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, popular: checked }))
                  }
                />
                <Label htmlFor="popular">Popular</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {service ? "Update Service" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
