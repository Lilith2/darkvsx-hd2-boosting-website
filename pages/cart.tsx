import dynamic from "next/dynamic";

const CartPage = dynamic(() => import("../client/pages/Cart"), {
  ssr: false,
});

export default CartPage;
