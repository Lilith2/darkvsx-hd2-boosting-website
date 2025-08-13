import dynamic from "next/dynamic";

const EmailConfirmationPage = dynamic(() => import("../src/pages/EmailConfirmation"), {
  ssr: false,
});

export default EmailConfirmationPage;
