import dynamic from "next/dynamic";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const DynamicServiceFilter = dynamic(
  () => import("@/components/ServiceFilter"),
  {
    loading: () => <LoadingSpinner className="h-8" />,
    ssr: false,
  },
);
