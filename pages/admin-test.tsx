import React from "react";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";

export default function AdminTest() {
  const {
    orders,
    customOrders,
    services,
    bundles,
    customPricing,
    analytics,
    isLoading,
    errors,
    hasErrors,
  } = useOptimizedAdminData();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (hasErrors) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Errors Found:</h1>
        <pre className="bg-red-50 p-4 rounded">{JSON.stringify(errors, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Data Test</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-bold">Orders</h2>
          <p>Count: {orders.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h2 className="font-bold">Custom Orders</h2>
          <p>Count: {customOrders.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="font-bold">Services</h2>
          <p>Count: {services.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <h2 className="font-bold">Bundles</h2>
          <p>Count: {bundles.length}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h2 className="font-bold mb-2">Analytics</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Total Revenue: ${analytics.totalRevenue}</div>
          <div>Pending Orders: {analytics.pendingOrdersCount}</div>
          <div>Active Services: {analytics.activeServicesCount}</div>
          <div>Total Customers: {analytics.totalCustomersCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="font-bold mb-2">Services</h3>
          <div className="space-y-1">
            {services.slice(0, 3).map(service => (
              <div key={service.id} className="text-sm">
                {service.title} - ${service.price}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
