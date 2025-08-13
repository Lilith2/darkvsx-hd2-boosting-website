import dynamic from "next/dynamic";

const CartPage = dynamic(() => import("../src/pages/Cart"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default CartPage;
