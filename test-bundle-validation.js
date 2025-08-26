// Test script to verify bundle validation is working
// Run this with: node test-bundle-validation.js

const baseUrl = 'http://localhost:3000';

async function testBundleValidation() {
  try {
    console.log('🧪 Testing bundle validation...');
    
    // Test with a bundle ID from the database 
    const bundleId = 'c573ce42-d103-409f-b4bb-3e7364c0031b'; // Elite Bundle
    
    const response = await fetch(`${baseUrl}/api/services/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceIds: [bundleId]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Bundle validation response:', JSON.stringify(result, null, 2));
    
    if (result.validServiceIds && result.validServiceIds.includes(bundleId)) {
      console.log('🎉 SUCCESS: Bundle is correctly validated as valid!');
      console.log('   - Bundle ID:', bundleId);
      console.log('   - Valid IDs:', result.validServiceIds);
      console.log('   - Invalid IDs:', result.invalidServiceIds);
    } else {
      console.log('❌ FAILURE: Bundle should be valid but was marked invalid');
      console.log('   - Bundle ID:', bundleId);
      console.log('   - Valid IDs:', result.validServiceIds);
      console.log('   - Invalid IDs:', result.invalidServiceIds);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBundleValidation();
