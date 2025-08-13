import dynamic from "next/dynamic";

const ContactPage = dynamic(() => import("../client/pages/Contact"), {
  ssr: false,
});

export default ContactPage;
