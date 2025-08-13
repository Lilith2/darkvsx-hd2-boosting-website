import dynamic from "next/dynamic";

const FAQPage = dynamic(() => import("../src/pages/FAQ"), {
  ssr: false,
});

export default FAQPage;
