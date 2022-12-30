import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import ConfirmationModal from '@components/ConfirmationModal';
import { useState } from 'react';
import { successToast } from '@components/Toaster';
import { copyToClipboard, fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { LinkPrimary } from '@components/LinkPrimary';
import { IconButton } from '@components/IconButton';
import { Pagination, pageLimit } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import Loading from '@components/Loading';
import type { SetupLinkService, SetupLink } from '@boxyhq/saml-jackson';
import type { ApiError, ApiSuccess } from 'types';

const SetupLinkList = ({ service }: { service: SetupLinkService }) => {
  const { paginate, setPaginate } = usePaginate();
  const { t } = useTranslation('common');
  const [showDelConfirmModal, setShowDelConfirmModal] = useState(false);
  const [showRegenConfirmModal, setShowRegenConfirmModal] = useState(false);
  const [selectedSetupLink, setSelectedSetupLink] = useState<SetupLink | null>(null);

  const { data, error, mutate } = useSWR<ApiSuccess<SetupLink[]>, ApiError>(
    `/api/admin/setup-links?service=${service}&offset=${paginate.offset}&limit=${pageLimit}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!data && !error) {
    return <Loading />;
  }

  const setupLinks = data?.data || [];

  // Regenerate a setup link
  const regenerateSetupLink = async () => {
    if (!selectedSetupLink) return;

    const { tenant, product, service } = selectedSetupLink;

    await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenant, product, service, regenerate: true }),
    });

    setSelectedSetupLink(null);
    setShowRegenConfirmModal(false);
    await mutate();
    successToast(t('link_regenerated'));
  };

  // Delete a setup link
  const deleteSetupLink = async () => {
    if (!selectedSetupLink) return;

    await fetch(`/api/admin/setup-links?setupID=${selectedSetupLink.setupID}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setSelectedSetupLink(null);
    setShowDelConfirmModal(false);
    await mutate();
    successToast(t('deleted'));
  };

  const createSetupLinkUrl =
    service === 'sso' ? '/admin/sso-connection/setup-link/new' : '/admin/directory-sync/setup-link/new';
  const title = service === 'sso' ? t('enterprise_sso') : t('directory_sync');
  const description = service === 'sso' ? t('setup_link_sso_description') : t('setup_link_dsync_description');

  return (
    <div>
      <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
        {t('setup_links') + ' (' + title + ')'}
      </h2>
      <div className='mb-5 flex items-center justify-between'>
        <h3>{description}</h3>
        <div>
          <LinkPrimary Icon={PlusIcon} href={createSetupLinkUrl} data-test-id='create-setup-link'>
            {t('new_setup_link')}
          </LinkPrimary>
        </div>
      </div>
      {setupLinks.length === 0 ? (
        <EmptyState title={t('no_setup_links_found')} href={createSetupLinkUrl} />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th scope='col' className='px-6 py-3'>
                    {t('tenant')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('product')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('validity')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {setupLinks.map((setupLink) => {
                  return (
                    <tr
                      key={setupLink.setupID}
                      className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                        {setupLink.tenant}
                      </td>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {setupLink.product}
                      </td>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        <p className={new Date(setupLink.validTill) < new Date() ? `text-red-400` : ``}>
                          {new Date(setupLink.validTill).toString()}
                        </p>
                      </td>
                      <td className='px-6 py-3'>
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('copy')}
                            Icon={ClipboardDocumentIcon}
                            className='mr-3 hover:text-green-400'
                            onClick={() => {
                              copyToClipboard(setupLink.url);
                              successToast(t('copied'));
                            }}
                          />
                          <IconButton
                            tooltip={t('regenerate')}
                            Icon={ArrowPathIcon}
                            className='mr-3 hover:text-green-400'
                            onClick={() => {
                              setSelectedSetupLink(setupLink);
                              setShowRegenConfirmModal(true);
                            }}
                          />
                          <IconButton
                            tooltip={t('delete')}
                            Icon={TrashIcon}
                            className='mr-3 hover:text-red-900'
                            onClick={() => {
                              setSelectedSetupLink(setupLink);
                              setShowDelConfirmModal(true);
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={setupLinks.length}
            offset={paginate.offset}
            onPrevClick={() => {
              setPaginate({
                offset: paginate.offset - pageLimit,
              });
            }}
            onNextClick={() => {
              setPaginate({
                offset: paginate.offset + pageLimit,
              });
            }}
          />
        </>
      )}
      <ConfirmationModal
        title={t('regenerate_setup_link')}
        description={t('regenerate_setup_link_description')}
        visible={showRegenConfirmModal}
        onConfirm={regenerateSetupLink}
        onCancel={() => {
          setShowRegenConfirmModal(false);
        }}
        actionButtonText={t('regenerate')}
      />
      <ConfirmationModal
        title={t('delete_setup_link')}
        description={t('delete_setup_link_description')}
        visible={showDelConfirmModal}
        onConfirm={deleteSetupLink}
        onCancel={() => {
          setShowDelConfirmModal(false);
        }}
      />
    </div>
  );
};

export default SetupLinkList;
