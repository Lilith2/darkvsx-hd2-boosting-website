/**
 * Test script to verify payment initialization fix
 */

async function testPaymentAPI() {
  const testPayload = {
    services: [
      {
        id: "5265efed-3187-4ede-943c-e01be26ef4f8", // Level Boost (1-50)
        quantity: 1
      }
    ],
    referralCode: "",
    referralDiscount: 0,
    creditsUsed: 0,
    currency: "usd",
    metadata: {
      orderId: "test_order_" + Date.now(),
      userEmail: "test@example.com",
      userName: "Test User",
      timestamp: new Date().toISOString(),
      clientTotal: "5.40"
    }
  };

  try {
    console.log("Testing payment API...");
    console.log("Request payload:", JSON.stringify(testPayload, null, 2));

    const response = await fetch("http://localhost:3000/api/stripe/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log("✅ SUCCESS: Payment intent created successfully");
      console.log("Client secret received:", !!data.clientSecret);
      console.log("Amount:", data.amount);
      console.log("Supported payment methods:", data.supportedPaymentMethods);
      return true;
    } else {
      console.log("❌ FAILED: Payment intent creation failed");
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error data:", errorData);
      } catch (e) {
        console.log("Could not parse error response as JSON");
      }
      return false;
    }
  } catch (error) {
    console.error("❌ ERROR: Test failed with exception:", error.message);
    return false;
  }
}

// Run the test
testPaymentAPI()
  .then(success => {
    console.log(success ? "\n🎉 Payment API test PASSED" : "\n💥 Payment API test FAILED");
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("💥 Test runner error:", error);
    process.exit(1);
  });
