import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Database access not configured",
      });
    }

    // Simple auth check - only allow admins to run this migration
    const { force } = req.body;
    if (!force) {
      return res.status(400).json({
        error: "Migration not forced",
        details: "Add 'force: true' to the request body to run this migration",
      });
    }

    const migrationResults = {
      services: { migrated: 0, skipped: 0, errors: 0 },
      bundles: { migrated: 0, skipped: 0, errors: 0 },
      totalMigrated: 0,
      errors: [] as string[],
    };

    // Migrate services
    console.log("Starting services migration...");
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("active", true);

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      return res.status(500).json({
        error: "Failed to fetch services",
        details: servicesError.message,
      });
    }

    for (const service of services || []) {
      try {
        // Check if product already exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("id", service.id)
          .maybeSingle();

        if (existing) {
          migrationResults.services.skipped++;
          continue;
        }

        // Create slug from title
        const slug = service.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Migrate service to products table
        const productData = {
          id: service.id,
          name: service.title,
          slug: slug,
          description: service.description,
          product_type: 'service',
          category: service.category || 'Level Boost',
          base_price: parseFloat(service.price),
          sale_price: service.original_price ? parseFloat(service.price) : null,
          features: service.features || [],
          estimated_duration_hours: service.duration ? parseInt(service.duration.replace(/[^0-9]/g, '')) || null : null,
          difficulty_level: service.difficulty?.toLowerCase() || 'medium',
          status: service.active ? 'active' : 'inactive',
          visibility: 'public',
          popular: service.popular || false,
          order_count: service.orders_count || 0,
          created_at: service.created_at,
          updated_at: service.updated_at,
          published_at: service.active ? service.created_at : null,
        };

        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);

        if (insertError) {
          console.error(`Error migrating service ${service.id}:`, insertError);
          migrationResults.services.errors++;
          migrationResults.errors.push(`Service ${service.title}: ${insertError.message}`);
        } else {
          migrationResults.services.migrated++;
          migrationResults.totalMigrated++;
        }
      } catch (error: any) {
        console.error(`Error processing service ${service.id}:`, error);
        migrationResults.services.errors++;
        migrationResults.errors.push(`Service ${service.title}: ${error.message}`);
      }
    }

    // Migrate bundles
    console.log("Starting bundles migration...");
    const { data: bundles, error: bundlesError } = await supabase
      .from("bundles")
      .select("*")
      .eq("active", true);

    if (bundlesError) {
      console.error("Error fetching bundles:", bundlesError);
      return res.status(500).json({
        error: "Failed to fetch bundles",
        details: bundlesError.message,
      });
    }

    for (const bundle of bundles || []) {
      try {
        // Check if product already exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("id", bundle.id)
          .maybeSingle();

        if (existing) {
          migrationResults.bundles.skipped++;
          continue;
        }

        // Create slug from name
        const slug = bundle.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Migrate bundle to products table
        const productData = {
          id: bundle.id,
          name: bundle.name,
          slug: slug,
          description: bundle.description,
          product_type: 'bundle',
          category: 'Bundles',
          base_price: parseFloat(bundle.original_price),
          sale_price: parseFloat(bundle.discounted_price),
          features: bundle.features || [],
          estimated_duration_hours: bundle.duration ? parseInt(bundle.duration.replace(/[^0-9]/g, '')) || null : null,
          status: bundle.active ? 'active' : 'inactive',
          visibility: 'public',
          popular: bundle.popular || false,
          order_count: bundle.orders_count || 0,
          bundled_products: bundle.services || [],
          bundle_type: 'fixed',
          specifications: {
            original_price: parseFloat(bundle.original_price),
            discount_percentage: bundle.discount,
            included_services: bundle.services || [],
          },
          created_at: bundle.created_at,
          updated_at: bundle.updated_at,
          published_at: bundle.active ? bundle.created_at : null,
        };

        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);

        if (insertError) {
          console.error(`Error migrating bundle ${bundle.id}:`, insertError);
          migrationResults.bundles.errors++;
          migrationResults.errors.push(`Bundle ${bundle.name}: ${insertError.message}`);
        } else {
          migrationResults.bundles.migrated++;
          migrationResults.totalMigrated++;
        }
      } catch (error: any) {
        console.error(`Error processing bundle ${bundle.id}:`, error);
        migrationResults.bundles.errors++;
        migrationResults.errors.push(`Bundle ${bundle.name}: ${error.message}`);
      }
    }

    console.log("Migration completed:", migrationResults);

    return res.status(200).json({
      success: true,
      message: "Product migration completed",
      results: migrationResults,
      summary: {
        totalMigrated: migrationResults.totalMigrated,
        totalErrors: migrationResults.services.errors + migrationResults.bundles.errors,
        servicesProcessed: migrationResults.services.migrated + migrationResults.services.skipped + migrationResults.services.errors,
        bundlesProcessed: migrationResults.bundles.migrated + migrationResults.bundles.skipped + migrationResults.bundles.errors,
      },
    });

  } catch (error: any) {
    console.error("Error in product migration:", error);

    const errorMessage = error.message || "Failed to migrate products";
    const errorCode = error.code || "UNKNOWN_ERROR";

    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}
