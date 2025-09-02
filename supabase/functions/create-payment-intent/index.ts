import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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

    // Get user from auth header (optional for guest checkout)
    let user = null;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        user = data.user;
      }
    } catch (error) {
      console.log("No authenticated user, proceeding with guest checkout");
    }

    const body = await req.json();
    const {
      items,
      customerEmail,
      customerName,
      customerDiscord,
      creditsUsed = 0,
      referralCode,
      metadata = {}
    } = body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty cart items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate totals from items
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

    // Apply credits and calculate final amount
    const creditsToUse = Math.min(creditsUsed, subtotal);
    const amountAfterCredits = Math.max(0, subtotal - creditsToUse);
    const taxAmount = amountAfterCredits * 0.08; // 8% tax
    const finalAmount = amountAfterCredits + taxAmount;

    // Minimum charge amount for Stripe (50 cents)
    if (finalAmount < 0.50) {
      if (creditsToUse >= subtotal) {
        // Can pay entirely with credits
        return new Response(
          JSON.stringify({ 
            canPayWithCreditsOnly: true,
            creditsRequired: subtotal,
            message: "This order can be paid entirely with credits"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Amount too small for card payment. Minimum $0.50 required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get or create Stripe customer
    const email = customerEmail || user?.email || "guest@example.com";
    let customerId = null;
    
    if (email !== "guest@example.com") {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          name: customerName || user?.user_metadata?.username || "Customer",
        });
        customerId = customer.id;
      }
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      payment_method_types: [
        "card",
        "us_bank_account",
        "venmo", // Add Venmo support
      ],
      payment_method_options: {
        card: {
          capture_method: "automatic",
        },
        us_bank_account: {
          verification_method: "automatic",
        },
        venmo: {
          // Configure Venmo using the provided connected account
        },
      },
      metadata: {
        order_type: "standard",
        customer_email: email,
        customer_name: customerName || user?.user_metadata?.username || "Customer",
        customer_discord: customerDiscord || "",
        user_id: user?.id || "",
        credits_used: creditsToUse.toString(),
        subtotal: subtotal.toString(),
        tax_amount: taxAmount.toString(),
        referral_code: referralCode || "",
        items_count: items.length.toString(),
        ...metadata,
      },
      // Add Venmo connected account if configured
      ...(Deno.env.get("VENMO_CONNECTED_ACCOUNT") && {
        transfer_data: {
          destination: Deno.env.get("VENMO_CONNECTED_ACCOUNT"),
        },
      }),
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        creditsUsed: creditsToUse,
        canPayWithCreditsOnly: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create payment intent",
        details: error?.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});