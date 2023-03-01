import type { NextApiRequest, NextApiResponse } from 'next';
import { strings } from '@lib/strings';
import jackson from '@lib/jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { checkLicense } = await jackson();

    if (!(await checkLicense())) {
      return res.status(404).json({
        error: {
          message: strings['enterprise_license_not_found'],
        },
      });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        return handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (err: any) {
    console.error('authorize error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect('/error');
  }
}

// Handle the SAML Request from Service Provider
// This endpoint act as Single Sign On (SSO) URL
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { SAMLRequest, RelayState, idp_hint } = req.query as {
    SAMLRequest: string;
    RelayState: string;
    idp_hint: string;
  };

  const { redirectUrl } = await samlFederatedController.sso.getAuthorizeUrl({
    request: SAMLRequest,
    relayState: RelayState,
    idp_hint,
  });

  return res.redirect(redirectUrl);
};
