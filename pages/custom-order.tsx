import dynamic from "next/dynamic";

const CustomOrderPage = dynamic(() => import("../src/pages/CustomOrder"), {
  ssr: false,
});

export default CustomOrderPage;
