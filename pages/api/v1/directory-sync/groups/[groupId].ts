import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get a group by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product, groupId } = req.query as {
    tenant: string;
    product: string;
    groupId: string;
  };

  directorySyncController.groups.setTenantAndProduct(tenant, product);

  const { data: group, error } = await directorySyncController.groups.get(groupId);

  // Get the members of the group if it exists
  if (group) {
    group['members'] = await directorySyncController.groups.getAllUsers(groupId);
  }

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data: group });
};
