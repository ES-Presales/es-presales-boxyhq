import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { adminController, apiConfigController } = await jackson();
    if (req.method === 'GET') {
      const { slug, pageOffset, pageLimit } = req.query;
      if (slug?.[0]) {
        res.json(await apiConfigController.getConfig({ clientID: slug[0] }));
      } else {
        res.json(
          await adminController.getAllConfig(+(pageOffset || 0) as number, +(pageLimit || 0) as number)
        );
      }
    } else if (req.method === 'POST') {
      const { strategy } = req.query;
      if (strategy !== 'saml' && strategy !== 'oidc') {
        res.status(404).send('Invalid strategy');
        return;
      }
      res.json(await apiConfigController.config(req.body, strategy));
    } else if (req.method === 'PATCH') {
      res.status(204).end(await apiConfigController.updateConfig(req.body));
    } else if (req.method === 'DELETE') {
      res.status(204).end(await apiConfigController.deleteConfig(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
};

export default checkSession(handler);
