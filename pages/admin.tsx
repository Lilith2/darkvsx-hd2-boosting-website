import dynamic from "next/dynamic";

const AdminDashboardPage = dynamic(() => import("../src/pages/AdminDashboard"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default AdminDashboardPage;
