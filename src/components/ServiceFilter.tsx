import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

type ServiceCategory = 'All' | 'Level Boost' | 'Medals' | 'Samples' | 'Super Credits' | 'Promotions';

interface ServiceFilterProps {
  onFilterChange: (category: ServiceCategory) => void;
  activeFilter: ServiceCategory;
  serviceCounts: Record<string, number>;
}

export function ServiceFilter({ onFilterChange, activeFilter, serviceCounts }: ServiceFilterProps) {
  const categories: ServiceCategory[] = ['All', 'Level Boost', 'Medals', 'Samples', 'Super Credits', 'Promotions'];

  const getCategoryIcon = (category: ServiceCategory) => {
    switch (category) {
      case 'Level Boost': return '📈';
      case 'Medals': return '🏅';
      case 'Samples': return '🧪';
      case 'Super Credits': return '💰';
      case 'Promotions': return '🎁';
      default: return '🎯';
    }
  };

  const getCategoryDescription = (category: ServiceCategory) => {
    switch (category) {
      case 'Level Boost': return 'Character progression & leveling';
      case 'Medals': return 'Weapon unlocks & upgrades';
      case 'Samples': return 'Research materials & specimens';
      case 'Super Credits': return 'Premium currency farming';
      case 'Promotions': return 'Special offers & bundles';
      default: return 'All available services';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filter Services</h3>
          {activeFilter !== 'All' && (
            <Badge variant="secondary" className="ml-2">
              {serviceCounts[activeFilter] || 0} services
            </Badge>
          )}
        </div>
        {activeFilter !== 'All' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange('All')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeFilter === category ? "default" : "outline"}
            onClick={() => onFilterChange(category)}
            className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 ${
              activeFilter === category 
                ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                : 'hover:bg-muted hover:scale-102'
            }`}
          >
            <div className="text-2xl">{getCategoryIcon(category)}</div>
            <div className="text-center">
              <div className="font-medium text-sm">{category}</div>
              <div className="text-xs opacity-70 mt-1">
                {category === 'All' ? `${Object.values(serviceCounts).reduce((a, b) => a + b, 0)} total` : `${serviceCounts[category] || 0} available`}
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Description */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium">{activeFilter}:</span> {getCategoryDescription(activeFilter)}
        </p>
      </div>
    </div>
  );
}
