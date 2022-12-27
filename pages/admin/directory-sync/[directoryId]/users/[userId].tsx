import type { NextPage } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { User } from '@boxyhq/saml-jackson';

import DirectoryTab from '@components/dsync/DirectoryTab';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { LinkBack } from '@components/LinkBack';

const UserInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, userId } = router.query as { directoryId: string; userId: string };

  const { directory, isLoading: isDirectoryLoading, error: directoryError } = useDirectory(directoryId);

  const { data: userData, error: userError } = useSWR<ApiSuccess<User>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/users/${userId}`,
    fetcher
  );

  if (isDirectoryLoading || !userData) {
    return <Loading />;
  }

  const error = directoryError || userError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const user = userData.data;

  return (
    <>
      <LinkBack href={`/admin/directory-sync/${directory.id}/users`} />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='users' />
        <div className='my-3 rounded border text-sm'>
          <SyntaxHighlighter language='json' style={coy}>
            {JSON.stringify(user, null, 3)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
