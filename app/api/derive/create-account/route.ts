import { NextRequest, NextResponse } from "next/server";
import { DERIVE_REST_MAINNET } from "@/app/lib/constants"

export async function POST(request: NextRequest) {
  console.log("🚀 API Route: POST /api/derive/create-account called");

  try {
    const body = await request.json();
    console.log("📋 Request body:", body);

    // Validate required parameters
    if (!body.wallet) {
      console.log("❌ Missing wallet parameter");
      return NextResponse.json(
        { error: { code: 10002, message: "Missing wallet parameter" } },
        { status: 400 },
      );
    }

    const url = `${DERIVE_REST_MAINNET}/public/create_account`;

    console.log("🌐 Making request to:", url);
    console.log("📤 Request payload:", { wallet: body.wallet });

    // Make the request to Derive API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        wallet: body.wallet,
      }),
    });

    console.log("📥 Response status:", response.status);
    console.log(
      "📥 Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    // Check if response is ok
    if (!response.ok) {
      console.log("❌ Response not ok, status:", response.status);
      const errorText = await response.text();
      console.log("❌ Error response text:", errorText);

      return NextResponse.json(
        {
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${errorText}`,
          },
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("✅ Response data:", data);

    // Return the response with proper CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("❌ Error in create-account proxy:", error);

    return NextResponse.json(
      {
        error: {
          code: 10000,
          message: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      },
      { status: 500 },
    );
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
