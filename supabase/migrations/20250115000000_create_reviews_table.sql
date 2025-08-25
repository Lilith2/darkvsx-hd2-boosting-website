-- Create reviews table for customer testimonials and feedback
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    
    -- Order association
    order_id UUID,
    order_number VARCHAR(255),
    service_name VARCHAR(255),
    
    -- Status and verification
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    featured_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_featured ON public.reviews(featured) WHERE featured = true;
CREATE INDEX idx_reviews_approved ON public.reviews(status, approved_at) WHERE status = 'approved';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Policy: Authenticated users can read their own reviews
CREATE POLICY "Users can read their own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Authenticated users can create reviews for their own orders
CREATE POLICY "Users can create reviews for their orders" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all reviews" ON public.reviews
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Admin users can manage all reviews
CREATE POLICY "Admin users can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add comment to table
COMMENT ON TABLE public.reviews IS 'Customer reviews and testimonials for completed orders';
COMMENT ON COLUMN public.reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN public.reviews.status IS 'Review status: pending, approved, or rejected';
COMMENT ON COLUMN public.reviews.verified IS 'Whether the review has been verified by staff';
COMMENT ON COLUMN public.reviews.featured IS 'Whether the review should be featured prominently';
COMMENT ON COLUMN public.reviews.metadata IS 'Additional metadata for the review (JSON)';
