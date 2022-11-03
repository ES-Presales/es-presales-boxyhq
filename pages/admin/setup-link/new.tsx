import type { NextPage } from 'next';
import Router, { useRouter } from 'next/router';
import CreateSetupLink from '@components/CreateSetupLink';

type Service = 'Jackson' | 'Directory-Sync';
const services = ['Jackson', 'Directory-Sync'];

const SetupLink: NextPage = () => {
  const { query } = useRouter();
  if (services.indexOf(query.service as string) === -1) {
    Router.replace('/');
  }
  return <CreateSetupLink service={query.service as Service} />;
};

export default SetupLink;
