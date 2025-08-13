import dynamic from 'next/dynamic';

const BundlesPage = dynamic(() => import('../src/pages/Bundles'), {
  ssr: false
});

export default BundlesPage;
