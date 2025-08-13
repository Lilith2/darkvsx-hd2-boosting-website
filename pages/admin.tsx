import dynamic from "next/dynamic";

const AdminDashboardPage = dynamic(() => import("../client/pages/AdminDashboard"), {
  ssr: false,
});

export default AdminDashboardPage;
