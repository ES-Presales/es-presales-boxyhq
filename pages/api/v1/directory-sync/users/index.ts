import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the users
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product } = req.query as { tenant: string; product: string };

  const { data, error } = await directorySyncController.users.setTenantAndProduct(tenant, product).list({});

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data });
};
