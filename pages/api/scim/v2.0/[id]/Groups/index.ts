import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scimController } = await jackson();
  const { method } = req;
  const { id } = req.query;

  if (!(await scimController.validateAPISecret(id as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  //
};

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  //
};
