import dynamic from "next/dynamic";

const PrivacyPage = dynamic(() => import("../src/pages/Privacy"), {
  ssr: false,
});

export default PrivacyPage;
