import dynamic from "next/dynamic";

const AccountPage = dynamic(() => import("../src/pages/Account"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default AccountPage;
