import dynamic from "next/dynamic";

const CheckoutPage = dynamic(() => import("../src/pages/Checkout"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default CheckoutPage;
