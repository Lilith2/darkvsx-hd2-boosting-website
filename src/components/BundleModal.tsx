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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Bundle } from "@/hooks/useBundles";

interface BundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bundle: Omit<Bundle, "id" | "created_at" | "updated_at">) => void;
  bundle?: Bundle | null;
}

interface FormData {
  name: string;
  description: string;
  services: string[];
  originalPrice: string;
  discountedPrice: string;
  discount: number;
  duration: string;
  features: string[];
  active: boolean;
  popular: boolean;
  badge: string;
}

export function BundleModal({
  isOpen,
  onClose,
  onSave,
  bundle,
}: BundleModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    services: [""],
    originalPrice: "",
    discountedPrice: "",
    discount: 0,
    duration: "",
    features: [""],
    active: true,
    popular: false,
    badge: "",
  });

  useEffect(() => {
    if (bundle) {
      setFormData({
        name: bundle.name,
        description: bundle.description,
        services: bundle.services.length > 0 ? bundle.services : [""],
        originalPrice: bundle.original_price.toString(),
        discountedPrice: bundle.discounted_price.toString(),
        discount: bundle.discount,
        duration: bundle.duration,
        features: bundle.features.length > 0 ? bundle.features : [""],
        active: bundle.active,
        popular: bundle.popular,
        badge: bundle.badge || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        services: [""],
        originalPrice: "",
        discountedPrice: "",
        discount: 0,
        duration: "",
        features: [""],
        active: true,
        popular: false,
        badge: "",
      });
    }
  }, [bundle, isOpen]);

  // Calculate discount when prices change
  useEffect(() => {
    const original = parseFloat(formData.originalPrice);
    const discounted = parseFloat(formData.discountedPrice);
    if (original > 0 && discounted > 0 && discounted < original) {
      const calculatedDiscount = Math.round(
        ((original - discounted) / original) * 100,
      );
      setFormData((prev) => ({ ...prev, discount: calculatedDiscount }));
    }
  }, [formData.originalPrice, formData.discountedPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bundleData = {
      name: formData.name,
      description: formData.description,
      services: formData.services.filter((service) => service.trim() !== ""),
      original_price: parseFloat(formData.originalPrice),
      discounted_price: parseFloat(formData.discountedPrice),
      discount: formData.discount,
      duration: formData.duration,
      features: formData.features.filter((feature) => feature.trim() !== ""),
      active: formData.active,
      popular: formData.popular,
      badge: formData.badge || null,
      orders_count: 0,
    };

    onSave(bundleData);
    onClose();
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, ""],
    }));
  };

  const updateService = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? value : service,
      ),
    }));
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bundle ? "Edit Bundle" : "Create New Bundle"}
          </DialogTitle>
          <DialogDescription>
            {bundle
              ? "Update the bundle information below."
              : "Fill in the details to create a new service bundle."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Bundle Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="e.g., 3-5 days"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="originalPrice">Original Price ($)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    originalPrice: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="discountedPrice">Discounted Price ($)</Label>
              <Input
                id="discountedPrice"
                type="number"
                step="0.01"
                value={formData.discountedPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountedPrice: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  readOnly
                  className="bg-muted"
                />
                <Badge variant="outline">{formData.discount}% OFF</Badge>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="badge">Badge (Optional)</Label>
            <Input
              id="badge"
              value={formData.badge}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, badge: e.target.value }))
              }
              placeholder="e.g., Best Value, Express"
            />
          </div>

          <div>
            <Label>Included Services</Label>
            <div className="space-y-2">
              {formData.services.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={service}
                    onChange={(e) => updateService(index, e.target.value)}
                    placeholder={`Service ${index + 1}`}
                  />
                  {formData.services.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeService(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>

          <div>
            <Label>Features</Label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-blue-600"
            >
              {bundle ? "Update Bundle" : "Create Bundle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
