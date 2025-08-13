import dynamic from "next/dynamic";

const BundlesPage = dynamic(() => import("../src/pages/Bundles"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default BundlesPage;
