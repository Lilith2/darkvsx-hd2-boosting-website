import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("../src/pages/Login"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default LoginPage;
