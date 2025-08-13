import dynamic from "next/dynamic";

const ContactPage = dynamic(() => import("../src/pages/Contact"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default ContactPage;
