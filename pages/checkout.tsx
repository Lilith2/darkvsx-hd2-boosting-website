import dynamic from "next/dynamic";

const CheckoutPage = dynamic(() => import("../client/pages/Checkout"), {
  ssr: false,
});

export default CheckoutPage;
