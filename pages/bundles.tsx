import dynamic from "next/dynamic";

const BundlesPage = dynamic(() => import("../client/pages/Bundles"), {
  ssr: false,
});

export default BundlesPage;
