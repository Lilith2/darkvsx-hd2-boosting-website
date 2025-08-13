import dynamic from "next/dynamic";

const CheckoutPage = dynamic(() => import("../src/pages/Checkout"), {
  ssr: false,
});

export default CheckoutPage;
