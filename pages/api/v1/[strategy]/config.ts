import jackson from '@lib/jackson';
import { extractAuthToken, validateApiKey } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { strategy } = req.query;
    if (strategy !== 'saml' && strategy !== 'oidc') {
      res.status(404).send('Invalid strategy');
      return;
    }
    const { configAPIController } = await jackson();
    if (req.method === 'POST') {
      res.json(await configAPIController.config(req.body, strategy));
    } else if (req.method === 'GET') {
      res.json(await configAPIController.getConfig(req.query as any));
    } else if (req.method === 'PATCH') {
      res.status(204).end(await configAPIController.updateConfig(req.body));
    } else if (req.method === 'DELETE') {
      res.status(204).end(await configAPIController.deleteConfig(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
