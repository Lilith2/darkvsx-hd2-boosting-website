import dynamic from 'next/dynamic';

const AccountPage = dynamic(() => import('../src/pages/Account'), {
  ssr: false
});

export default AccountPage;
