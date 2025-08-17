import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { BundleData } from "@/hooks/useBundles";

interface AdminBundlesTabProps {
  bundles: BundleData[];
  loading: boolean;
  onAddBundle: () => void;
  onEditBundle: (bundle: BundleData) => void;
  onDeleteBundle: (id: string) => void;
}

export function AdminBundlesTab({
  bundles,
  loading,
  onAddBundle,
  onEditBundle,
  onDeleteBundle,
}: AdminBundlesTabProps) {
  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Manage Bundles ({bundles.length})
          </CardTitle>
          <CardDescription>
            Create and manage service bundle packages
          </CardDescription>
        </div>
        <Button onClick={onAddBundle} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Bundle
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
            <p className="mb-4">Create your first bundle to offer multiple services at a discount</p>
            <Button onClick={onAddBundle}>
              <Plus className="w-4 h-4 mr-2" />
              Add Bundle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="border border-border/30 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {bundle.name}
                        </h3>
                        <Badge
                          variant={bundle.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {bundle.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${bundle.price}
                        </div>
                        {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                          <div className="text-sm text-muted-foreground line-through">
                            ${bundle.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bundle.description}
                    </p>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Services included:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {bundle.serviceIds?.slice(0, 3).map((serviceId, index) => (
                          <Badge key={serviceId} variant="outline" className="text-xs">
                            Service {index + 1}
                          </Badge>
                        ))}
                        {bundle.serviceIds && bundle.serviceIds.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{bundle.serviceIds.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditBundle(bundle)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteBundle(bundle.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
