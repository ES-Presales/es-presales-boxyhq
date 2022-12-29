import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    case 'DELETE':
      return await handleDELETE(req, res);
    default:
      res.setHeader('Allow', 'GET, DELETE');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get all events
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, offset, limit } = req.query as { directoryId: string; offset: string; limit: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(400).json({ error });
  }

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const events = await directorySyncController.webhookLogs.with(directory.tenant, directory.product).getAll({
    pageOffset,
    pageLimit,
  });

  return res.status(200).json({ data: events });
};

// Delete all events
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(400).json({ error });
  }

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  await directorySyncController.webhookLogs.with(directory.tenant, directory.product).clear();

  return res.status(200).json({ data: null });
};

export default checkSession(handler);
