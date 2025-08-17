import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { ServiceData } from "@/hooks/useServices";

interface AdminServicesTabProps {
  services: ServiceData[];
  loading: boolean;
  onAddService: () => void;
  onEditService: (service: ServiceData) => void;
  onDeleteService: (id: string) => void;
}

export function AdminServicesTab({
  services,
  loading,
  onAddService,
  onEditService,
  onDeleteService,
}: AdminServicesTabProps) {
  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Manage Services ({services.length})
          </CardTitle>
          <CardDescription>
            Create and manage services offered to customers
          </CardDescription>
        </div>
        <Button onClick={onAddService} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No services yet</h3>
            <p className="mb-4">Create your first service to get started</p>
            <Button onClick={onAddService}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="border border-border/30 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {service.name}
                        </h3>
                        <Badge
                          variant={service.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {service.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${service.price}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Duration: {service.duration}</span>
                      <span>{service.features.length} features</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditService(service)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteService(service.id)}
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
