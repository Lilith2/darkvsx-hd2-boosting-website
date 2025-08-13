import dynamic from 'next/dynamic';

const LoginPage = dynamic(() => import('../src/pages/Login'), {
  ssr: false
});

export default LoginPage;
