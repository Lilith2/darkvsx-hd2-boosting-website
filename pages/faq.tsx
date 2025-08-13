import dynamic from "next/dynamic";

const FAQPage = dynamic(() => import("../client/pages/FAQ"), {
  ssr: false,
});

export default FAQPage;
