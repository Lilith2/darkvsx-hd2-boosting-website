import dynamic from 'next/dynamic';
import { LoadingSpinner } from './LoadingSpinner';

export const DynamicServiceFilter = dynamic(() => import('./ServiceFilter'), {
  loading: () => <LoadingSpinner className="h-8" />,
  ssr: false
});
