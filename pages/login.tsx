import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("../client/pages/Login"), {
  ssr: false,
});

export default LoginPage;
