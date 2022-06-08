import type { NextPage } from 'next';
import { Input, Button, Select } from '@supabase/ui';
import React from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const newDirectory = {
  name: '',
  tenant: '',
  product: '',
  webhook_url: '',
  webhook_secret: '',
  type: '',
};

const New: NextPage = () => {
  const router = useRouter();
  const [directory, setDirectory] = React.useState(newDirectory);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/directory-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directory),
    });

    setLoading(false);

    const { data, error } = await rawResponse.json();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      toast.success('Directory created successfully');
      router.replace(`/admin/directory-sync/${data.id}`);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setDirectory({
      ...directory,
      [target.id]: target.value,
    });
  };

  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>New Configuration</h2>
      </div>
      <div className='w-1/2 rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <Input label='Directory name' id='name' className='mb-3' required onChange={onChange} />
          <Select label='Directory provider' id='type' onChange={onChange} className='mb-3' required>
            <Select.Option value=''>Select IdP</Select.Option>
            <Select.Option value='okta'>Okta</Select.Option>
            <Select.Option value='onelogin'>OneLogin</Select.Option>
            <Select.Option value='azure'>Azure AD</Select.Option>
          </Select>
          <Input label='Tenant' id='tenant' className='mb-3' required onChange={onChange} />
          <Input label='Product' id='product' className='mb-3' required onChange={onChange} />
          <Input label='Webhook URL' id='webhook_url' className='mb-3' onChange={onChange} />
          <Input label='Webhook secret' id='webhook_secret' className='mb-3' onChange={onChange} />
          <Button size='small' loading={loading}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default New;
