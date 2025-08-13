import dynamic from "next/dynamic";

const TermsPage = dynamic(() => import("../src/pages/Terms"), {
  ssr: false,
});

export default TermsPage;
