import type { NextPage } from 'next';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import WrenchScrewdriverIcon from '@heroicons/react/24/outline/WrenchScrewdriverIcon';
import { useTranslation } from 'next-i18next';
import { Table, LinkPrimary } from '@boxyhq/internal-ui';

const Policies: NextPage = () => {
  const policies = [
    { id: 'sasd124sjnasfnasf', project_name: 'dev', name: 'dev_test', created: '2023-04-21T07:17:54' },
  ];
  const { t } = useTranslation('common');
  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('policies')}</h2>
        <LinkPrimary href={'/admin/llm-vault/policies/new'}>{t('new_policy')}</LinkPrimary>
      </div>
      <>
        <Table
          cols={[t('bui-shared-name'), t('id'), t('created_at'), t('bui-shared-actions')]}
          body={policies.map((policy) => {
            return {
              id: policy.id,
              cells: [
                {
                  wrap: true,
                  text: policy.name,
                },
                {
                  wrap: true,
                  text: policy.id,
                },
                {
                  wrap: true,
                  text: new Date(policy.created).toLocaleString(),
                },
                {
                  actions: [
                    {
                      text: t('bui-shared-edit'),
                      icon: <WrenchScrewdriverIcon className='h-5 w-5' />,
                    },
                    {
                      text: t('bui-shared-delete'),
                      icon: <TrashIcon className='h-5 w-5' />,
                    },
                  ],
                },
              ],
            };
          })}></Table>
      </>
    </div>
  );
};

export default Policies;
