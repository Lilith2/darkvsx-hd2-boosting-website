import dynamic from "next/dynamic";

const CustomOrderPage = dynamic(() => import("../client/pages/CustomOrder"), {
  ssr: false,
});

export default CustomOrderPage;
