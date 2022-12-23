import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  try {
    const { data: directory } = await directorySyncController.directories.get(directoryId);

    if (!directory) {
      return res.status(404).json({ error: { message: 'Directory not found.' } });
    }

    const { tenant, product } = directory;

    const events = await directorySyncController.webhookLogs.with(tenant, product).getAll();

    return res.status(200).json({ data: events });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);
