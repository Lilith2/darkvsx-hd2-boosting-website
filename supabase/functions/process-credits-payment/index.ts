import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required for credits payment" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    const body = await req.json();
    const {
      items,
      customerEmail,
      customerName,
      customerDiscord,
      creditsToUse,
      referralCode,
      notes,
      specialInstructions,
    } = body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty cart items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate order total
    let subtotal = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return new Response(
          JSON.stringify({ error: "Invalid item data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      subtotal += item.unit_price * item.quantity;
    }

    // Check if credits are sufficient
    if (creditsToUse < subtotal) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits for this order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's current credit balance
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.credit_balance < creditsToUse) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credit balance",
          available: profile.credit_balance,
          required: creditsToUse
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order in unified_orders table
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const { data: order, error: orderError } = await supabaseClient
      .from("unified_orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        order_type: "standard",
        customer_name: customerName || user.user_metadata?.username || "Customer",
        customer_email: customerEmail || user.email,
        customer_discord: customerDiscord || "",
        items: items,
        subtotal_amount: subtotal,
        tax_amount: 0, // No tax when paying with credits only
        discount_amount: 0,
        credits_used: creditsToUse,
        total_amount: 0, // Fully paid with credits
        status: "confirmed",
        payment_status: "paid",
        fulfillment_status: "pending",
        payment_method: "credits",
        referral_code: referralCode || "",
        notes: notes || "",
        special_instructions: specialInstructions || "",
        transaction_id: `credits_${Date.now()}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order", details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits from user's balance
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ 
        credit_balance: profile.credit_balance - creditsToUse,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating credit balance:", updateError);
      // Rollback the order if credit deduction fails
      await supabaseClient.from("unified_orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to process credits payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record credit transaction
    await supabaseClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsToUse, // Negative for deduction
      transaction_type: "used",
      description: `Payment for order ${orderNumber}`,
      order_id: order.id,
      balance_before: profile.credit_balance,
      balance_after: profile.credit_balance - creditsToUse,
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        creditsUsed: creditsToUse,
        remainingBalance: profile.credit_balance - creditsToUse,
        transactionId: `credits_${Date.now()}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error processing credits payment:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process credits payment",
        details: error?.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});