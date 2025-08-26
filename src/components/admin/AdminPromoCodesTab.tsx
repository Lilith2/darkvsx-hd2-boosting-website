import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Gift,
  Users,
  DollarSign,
  Percent,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminPromoCodesTab() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null,
  );
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: 0,
    max_uses: null as number | null,
    expires_at: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Type-safe transformation of the data
      const typedData: PromoCode[] = (data || []).map(item => ({
        ...item,
        discount_type: item.discount_type as "percentage" | "fixed_amount",
        current_uses: item.current_uses || 0,
        is_active: item.is_active ?? true,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));

      setPromoCodes(typedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch promo codes: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PROMO-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      max_uses: null,
      expires_at: "",
      is_active: true,
    });
    setEditingPromoCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast({
        title: "Error",
        description: "Promo code is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        title: "Error",
        description: "Discount value must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const promoData = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_uses: formData.max_uses,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingPromoCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingPromoCode.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });
      } else {
        const { error } = await supabase.from("promo_codes").insert([
          {
            ...promoData,
            current_uses: 0,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Promo code created successfully",
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save promo code: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      max_uses: promoCode.max_uses,
      expires_at: promoCode.expires_at
        ? promoCode.expires_at.split("T")[0]
        : "",
      is_active: promoCode.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (promoCode: PromoCode) => {
    if (
      !confirm(
        `Are you sure you want to delete promo code "${promoCode.code}"?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", promoCode.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete promo code: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({
          is_active: !promoCode.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", promoCode.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code ${!promoCode.is_active ? "activated" : "deactivated"}`,
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update promo code: " + error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `Promo code "${code}" copied to clipboard`,
    });
  };

  const getDiscountDisplay = (promoCode: PromoCode) => {
    if (promoCode.discount_type === "percentage") {
      return `${promoCode.discount_value}%`;
    } else {
      return `$${promoCode.discount_value}`;
    }
  };

  const getUsageDisplay = (promoCode: PromoCode) => {
    if (promoCode.max_uses === null) {
      return `${promoCode.current_uses} / Unlimited`;
    }
    return `${promoCode.current_uses} / ${promoCode.max_uses}`;
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    if (!promoCode.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return <Badge variant="destructive">Used Up</Badge>;
    }

    return (
      <Badge variant="default" className="bg-green-600">
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-40 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="h-96 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promo Codes</h2>
          <p className="text-muted-foreground">
            Create and manage discount codes for your store
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPromoCode ? "Edit Promo Code" : "Create Promo Code"}
              </DialogTitle>
              <DialogDescription>
                {editingPromoCode
                  ? "Update the promo code settings"
                  : "Create a new discount code for customers"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promo Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="PROMO-XXXXXX"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    onClick={generateRandomCode}
                    variant="outline"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed_amount") =>
                      setFormData((prev) => ({ ...prev, discount_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === "percentage"
                      ? "Percentage (%)"
                      : "Amount ($)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step={
                      formData.discount_type === "percentage" ? "1" : "0.01"
                    }
                    max={
                      formData.discount_type === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discount_value: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max Uses (Optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_uses: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires On (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromoCode ? "Update" : "Create"} Promo Code
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promoCodes.filter((p) => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promoCodes.reduce((sum, p) => sum + p.current_uses, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Discount
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promoCodes.length > 0
                ? Math.round(
                    promoCodes.reduce(
                      (sum, p) =>
                        sum +
                        (p.discount_type === "percentage"
                          ? p.discount_value
                          : 0),
                      0,
                    ) /
                      promoCodes.filter((p) => p.discount_type === "percentage")
                        .length || 0,
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
          <CardDescription>
            Manage your discount codes and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promoCode) => (
                <TableRow key={promoCode.id}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{promoCode.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(promoCode.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getDiscountDisplay(promoCode)}</TableCell>
                  <TableCell>{getUsageDisplay(promoCode)}</TableCell>
                  <TableCell>{getStatusBadge(promoCode)}</TableCell>
                  <TableCell>
                    {promoCode.expires_at
                      ? format(new Date(promoCode.expires_at), "MMM dd, yyyy")
                      : "No expiry"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(promoCode.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(promoCode.code)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(promoCode)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(promoCode)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {promoCode.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(promoCode)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {promoCodes.length === 0 && (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No promo codes
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first promo code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
