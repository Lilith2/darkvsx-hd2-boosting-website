import dynamic from "next/dynamic";

const OrderTrackingPage = dynamic(() => import("../../src/pages/OrderTracking"), {
  ssr: false,
});

export default OrderTrackingPage;
