import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Info: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory }) => {
  const { t } = useTranslation('common');
  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='directory' />
        <div className='my-3 rounded border'>
          <dl>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('directory_id')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
            </div>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('tenant')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
            </div>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('product')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
            </div>
            <div className='border-b bg-gray-100 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='pt-2 text-sm font-medium text-gray-500'>{t('scim_endpoint')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.scim.endpoint}</dd>
            </div>
            <div className='border-b bg-gray-100 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='pt-2 text-sm font-medium text-gray-500'>{t('scim_token')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.scim.secret}</dd>
            </div>
            {directory.webhook.endpoint && directory.webhook.secret && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('webhook_endpoint')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.endpoint}
                  </dd>
                </div>
                <div className='px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='pt-2 text-sm font-medium text-gray-500'>{t('webhook_secret')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.secret}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId } = context.query;
  const { directorySyncController } = await jackson();
  const { locale }: GetServerSidePropsContext = context;

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Info;
