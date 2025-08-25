import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  useReviews, 
  updateReviewStatus, 
  Review,
  submitReview 
} from "@/hooks/useReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Star, 
  Clock, 
  Award,
  Trash2,
  Edit
} from "lucide-react";

interface AdminReviewsTabProps {
  loading?: boolean;
  onInvalidateAll?: () => void;
}

export function AdminReviewsTab({ 
  loading = false, 
  onInvalidateAll 
}: AdminReviewsTabProps) {
  const { toast } = useToast();
  
  // Fetch reviews by status
  const { reviews: pendingReviews, loading: pendingLoading, refetch: refetchPending } = 
    useReviews({ status: "pending" });
  const { reviews: approvedReviews, loading: approvedLoading, refetch: refetchApproved } = 
    useReviews({ status: "approved" });
  const { reviews: rejectedReviews, loading: rejectedLoading, refetch: refetchRejected } = 
    useReviews({ status: "rejected" });

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    rating: 5,
    title: "",
    comment: "",
    service_name: ""
  });

  // Handle review approval
  const handleApproveReview = async (reviewId: string, featured = false) => {
    try {
      const result = await updateReviewStatus(reviewId, "approved", featured);
      
      if (result.success) {
        toast({
          title: "Review Approved",
          description: featured 
            ? "Review has been approved and featured."
            : "Review has been approved.",
        });
        
        // Refresh data
        refetchPending();
        refetchApproved();
        onInvalidateAll?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve review.",
        variant: "destructive",
      });
    }
  };

  // Handle review rejection
  const handleRejectReview = async (reviewId: string) => {
    try {
      const result = await updateReviewStatus(reviewId, "rejected");
      
      if (result.success) {
        toast({
          title: "Review Rejected",
          description: "Review has been rejected.",
        });
        
        // Refresh data
        refetchPending();
        refetchRejected();
        onInvalidateAll?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject review.",
        variant: "destructive",
      });
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "Review has been permanently deleted.",
      });

      // Refresh all review lists
      refetchPending();
      refetchApproved();
      refetchRejected();
      onInvalidateAll?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review.",
        variant: "destructive",
      });
    }
  };

  // Handle review editing
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      customer_name: review.customer_name,
      rating: review.rating,
      title: review.title || "",
      comment: review.comment,
      service_name: review.service_name || ""
    });
    setIsEditModalOpen(true);
  };

  // Save edited review
  const handleSaveEditedReview = async () => {
    if (!editingReview) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("reviews")
        .update({
          customer_name: editForm.customer_name,
          rating: editForm.rating,
          title: editForm.title || null,
          comment: editForm.comment,
          service_name: editForm.service_name || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingReview.id);

      if (error) throw error;

      toast({
        title: "Review Updated",
        description: "Review has been updated successfully.",
      });

      // Refresh data
      refetchPending();
      refetchApproved();
      refetchRejected();
      onInvalidateAll?.();
      
      setIsEditModalOpen(false);
      setEditingReview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update review.",
        variant: "destructive",
      });
    }
  };

  // Feature/unfeature review
  const handleToggleFeature = async (review: Review) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const newFeaturedStatus = !review.featured;
      
      const updateData: any = {
        featured: newFeaturedStatus,
        updated_at: new Date().toISOString()
      };

      if (newFeaturedStatus) {
        updateData.featured_at = new Date().toISOString();
      } else {
        updateData.featured_at = null;
      }

      const { error } = await supabase
        .from("reviews")
        .update(updateData)
        .eq("id", review.id);

      if (error) throw error;

      toast({
        title: newFeaturedStatus ? "Review Featured" : "Review Unfeatured",
        description: `Review has been ${newFeaturedStatus ? "featured" : "unfeatured"}.`,
      });

      // Refresh data
      refetchApproved();
      onInvalidateAll?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update review feature status.",
        variant: "destructive",
      });
    }
  };

  // Statistics
  const totalReviews = pendingReviews.length + approvedReviews.length + rejectedReviews.length;
  const avgRating = approvedReviews.length > 0 
    ? (approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length).toFixed(1)
    : 0;
  const featuredCount = approvedReviews.filter(review => review.featured).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{featuredCount}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Management */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Review Management
          </CardTitle>
          <CardDescription>
            Approve, reject, or modify customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingReviews.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {pendingReviews.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedReviews.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedReviews.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Reviews */}
            <TabsContent value="pending" className="space-y-4">
              {pendingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : pendingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No pending reviews</h3>
                  <p className="text-muted-foreground">All reviews have been processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingReviews.map((review) => (
                    <div key={review.id} className="relative">
                      <ReviewCard 
                        review={review}
                        showActions={true}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                      <div className="mt-4 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReview(review.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveReview(review.id, true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Feature
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectReview(review.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Approved Reviews */}
            <TabsContent value="approved" className="space-y-4">
              {approvedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : approvedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No approved reviews</h3>
                  <p className="text-muted-foreground">Approved reviews will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {approvedReviews.map((review) => (
                    <div key={review.id} className="relative">
                      <ReviewCard 
                        review={review}
                        showActions={true}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                      <div className="mt-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleFeature(review)}
                          className={review.featured ? "bg-purple-100 border-purple-300" : ""}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          {review.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectReview(review.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Rejected Reviews */}
            <TabsContent value="rejected" className="space-y-4">
              {rejectedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : rejectedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No rejected reviews</h3>
                  <p className="text-muted-foreground">Rejected reviews will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {rejectedReviews.map((review) => (
                    <div key={review.id} className="relative">
                      <ReviewCard 
                        review={review}
                        showActions={true}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                      <div className="mt-4 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReview(review.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Review Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Make changes to this review. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_name" className="text-right">
                Customer
              </Label>
              <Input
                id="customer_name"
                value={editForm.customer_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Rating
              </Label>
              <Select
                value={editForm.rating.toString()}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, rating: parseInt(value) }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} Star{rating > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service_name" className="text-right">
                Service
              </Label>
              <Input
                id="service_name"
                value={editForm.service_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, service_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="comment" className="text-right pt-2">
                Comment
              </Label>
              <Textarea
                id="comment"
                value={editForm.comment}
                onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedReview}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
