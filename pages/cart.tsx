import dynamic from "next/dynamic";

const CartPage = dynamic(() => import("../src/pages/Cart"), {
  ssr: false,
});

export default CartPage;
