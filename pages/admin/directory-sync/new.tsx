import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/outline';

import jackson from '@lib/jackson';
import classNames from 'classnames';

const New: NextPage<{ providers: any }> = ({ providers }) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [directory, setDirectory] = React.useState({
    name: '',
    tenant: '',
    product: '',
    webhook_url: '',
    webhook_secret: '',
    type: '',
  });

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
      <Link href='/admin/directory-sync'>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </a>
      </Link>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>New Directory</h2>
      <div className='w-full border border-gray-200 bg-white p-6 first-letter:rounded md:w-3/4'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-2'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Directory name</span>
              </label>
              <input
                type='text'
                id='name'
                className='input input-bordered w-full'
                required
                onChange={onChange}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Directory provider</span>
              </label>
              <select className='select select-bordered w-full' id='type' onChange={onChange} required>
                {Object.keys(providers).map((key) => {
                  return (
                    <option key={key} value={key}>
                      {providers[key]}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Tenant</span>
              </label>
              <input
                type='text'
                id='tenant'
                className='input input-bordered w-full'
                required
                onChange={onChange}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Product</span>
              </label>
              <input
                type='text'
                id='product'
                className='input input-bordered w-full'
                required
                onChange={onChange}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Webhook URL</span>
              </label>
              <input
                type='text'
                id='webhook_url'
                className='input input-bordered w-full'
                onChange={onChange}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Webhook secret</span>
              </label>
              <input
                type='text'
                id='webhook_secret'
                className='input input-bordered w-full'
                onChange={onChange}
              />
            </div>
            <div>
              <button className={classNames('btn btn-primary', loading ? 'loading' : '')}>
                Create Directory
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const { directorySyncController } = await jackson();

  return {
    props: {
      providers: directorySyncController.providers(),
    },
  };
};

export default New;
