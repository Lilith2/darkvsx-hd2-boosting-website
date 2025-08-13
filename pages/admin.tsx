import dynamic from "next/dynamic";

const AdminDashboardPage = dynamic(() => import("../src/pages/AdminDashboard"), {
  ssr: false,
});

export default AdminDashboardPage;
