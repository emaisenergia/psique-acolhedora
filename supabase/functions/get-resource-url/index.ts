import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { resourceId } = await req.json();
    if (!resourceId || typeof resourceId !== "string") {
      return new Response(JSON.stringify({ error: "resourceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to check resource access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the resource
    const { data: resource, error: resError } = await supabaseAdmin
      .from("therapeutic_resources")
      .select("id, resource_url, patient_id, is_visible, user_id")
      .eq("id", resourceId)
      .single();

    if (resError || !resource) {
      return new Response(JSON.stringify({ error: "Resource not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is staff (admin/psychologist)
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isStaff = roles?.some((r: any) => r.role === "admin" || r.role === "psychologist");

    if (!isStaff) {
      // Patient access: verify they are the assigned patient and resource is visible
      if (!resource.is_visible) {
        return new Response(JSON.stringify({ error: "Resource not visible" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: patient } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!patient) {
        return new Response(JSON.stringify({ error: "Not a patient" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resource must be for this patient or global (null patient_id)
      if (resource.patient_id && resource.patient_id !== patient.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Extract storage path from URL if it's a storage URL
    const url = resource.resource_url;
    if (!url) {
      return new Response(JSON.stringify({ error: "No URL for resource" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if it's a storage URL (contains /storage/v1/object/)
    const storagePattern = /\/storage\/v1\/object\/(?:public|sign)\/therapeutic-resources\/(.+?)(?:\?|$)/;
    const match = url.match(storagePattern);

    if (!match) {
      // External URL, just return it
      return new Response(JSON.stringify({ signedUrl: url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = decodeURIComponent(match[1]);

    // Generate signed URL using service role
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("therapeutic-resources")
      .createSignedUrl(filePath, 3600); // 1 hour

    if (signError || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate signed URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl: signedData.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
