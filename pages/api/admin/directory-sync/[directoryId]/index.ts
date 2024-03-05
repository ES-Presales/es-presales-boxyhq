import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminHandler } from '@lib/api/adminHandler';
import { ApiError } from 'next/dist/server/api-utils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await adminHandler(req, res, {
    GET: handleGET,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
};

// Update a directory configuration
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.update(directoryId, req.body);

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  res.json({ data });
};

// Get a directory configuration
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  res.json({ data });
};

// Delete a directory configuration
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { error } = await directorySyncController.directories.delete(directoryId);

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  res.json({ data: null });
};

export default handler;
