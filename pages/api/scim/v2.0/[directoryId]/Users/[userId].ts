import type { NextApiRequest, NextApiResponse } from 'next';
import type { HTTPMethod } from '@lib/jackson';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySyncController } = await jackson();
  const { method } = req;
  const { directoryId, userId } = req.query;

  if (
    !(await directorySyncController.directories.validateAPISecret(
      directoryId as string,
      extractAuthToken(req)
    ))
  ) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  const request = {
    method: method as HTTPMethod,
    body: bodyParser(req),
    query: {
      directory_id: directoryId as string,
      user_id: userId as string,
    },
  };

  const { status, data } = await directorySyncController.usersRequest.handle(request);

  return res.status(status).json(data);
}
