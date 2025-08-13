import dynamic from 'next/dynamic';

const RegisterPage = dynamic(() => import('../src/pages/Register'), {
  ssr: false
});

export default RegisterPage;
