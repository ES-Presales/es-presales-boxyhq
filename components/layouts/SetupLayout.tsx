import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Logo from '../../public/logo.png';

export const SetupLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { token } = router.query;
  return (
    <>
      <Head>
        <title>SAML Jackson - BoxyHQ</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='flex flex-1 flex-col'>
        <div className='sticky top-0 z-10 flex h-16 flex-shrink-0 border-b bg-white'>
        <div className='flex flex-shrink-0 items-center px-4'>
              <Link href={`/setup/${token}`}>
                <a className='flex items-center'>
                  <Image
                    src={Logo}
                    alt='BoxyHQ'
                    layout='fixed'
                    width={36}
                    height={36}
                    className='h-8 w-auto'
                  />
                </a>
              </Link>
            </div>
        </div>
        <main>
          <div className='py-6'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 md:px-8'>{children}</div>
          </div>
        </main>
      </div>
    </>
  );
};
