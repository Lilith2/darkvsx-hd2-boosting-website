import dynamic from "next/dynamic";

const ForgotPasswordPage = dynamic(() => import("../src/pages/ForgotPassword"), {
  ssr: false,
});

export default ForgotPasswordPage;
