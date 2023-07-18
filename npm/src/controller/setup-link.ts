import {
  SetupLink,
  SetupLinkCreatePayload,
  Storable,
  PaginationParams,
  SetupLinkService,
  Index,
} from '../typings';
import * as dbutils from '../db/utils';
import { IndexNames, validateTenantAndProduct, validateRedirectUrl, extractRedirectUrls } from './utils';
import crypto from 'crypto';
import { JacksonError } from './error';

interface FilterByParams extends PaginationParams {
  service?: SetupLinkService;
  product?: string;
  tenant?: string;
}

const throwIfInvalidService = (service: string) => {
  if (!['sso', 'dsync'].includes(service)) {
    throw new JacksonError('Invalid service provided. Supported values are: sso, dsync', 400);
  }
};

/**
 * @swagger
 * definitions:
 *   SetupLink:
 *      type: object
 *      properties:
 *        setupID:
 *          type: string
 *          description: Setup link ID
 *        tenant:
 *          type: string
 *          description: Tenant
 *        product:
 *          type: string
 *          description: Product
 *        service:
 *          type: string
 *          description: Service name (sso or dsync)
 *        validTill:
 *          type: string
 *          description: Valid till timestamp
 *        url:
 *          type: string
 *          description: Setup link URL
 */
export class SetupLinkController {
  setupLinkStore: Storable;

  constructor({ setupLinkStore }) {
    this.setupLinkStore = setupLinkStore;
  }

  /**
   * @swagger
   * definitions:
   *    SetupLink:
   *      type: object
   *      example:
   *        {
   *        	"data": {
   *        		"setupID": "0689f76f7b5aa22f00381a124cb4b153fc1a8c08",
   *        		"tenant": "acme",
   *        		"product": "my-app",
   *        		"service": "sso",
   *        		"validTill": 1689849146690,
   *        		"url": "http://localhost:5225/setup/0b96a483ebfe0af0b561dda35a96647074d944631ff9e070"
   *        	}
   *        }
   * parameters:
   *   serviceParamPost:
   *     name: service
   *     description: Service name (sso or dsync)
   *     in: formData
   *     required: true
   *     type: string
   *   tenantParamPost:
   *     name: tenant
   *     description: Tenant
   *     in: formData
   *     required: true
   *     type: string
   *   productParamPost:
   *     name: product
   *     description: Product
   *     in: formData
   *     required: true
   *     type: string
   * /api/v1/setup-links:
   *   post:
   *    summary: Create a new Setup Link
   *    operationId: create-setup-link
   *    tags: [Setup Link]
   *    produces:
   *      - application/json
   *    consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *    parameters:
   *      - $ref: '#/parameters/serviceParamPost'
   *      - $ref: '#/parameters/tenantParamPost'
   *      - $ref: '#/parameters/productParamPost'
   *    responses:
   *      200:
   *        description: Success
   *        schema:
   *          $ref:  '#/definitions/SetupLink'
   */
  async create(body: SetupLinkCreatePayload): Promise<SetupLink> {
    const { tenant, product, service, name, description, defaultRedirectUrl, regenerate, redirectUrl } = body;

    validateTenantAndProduct(tenant, product);

    if (defaultRedirectUrl || redirectUrl) {
      const redirectUrlList = extractRedirectUrls(redirectUrl || '');
      validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });
    }

    throwIfInvalidService(service);

    const setupID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, service));
    const token = crypto.randomBytes(24).toString('hex');

    const existing: SetupLink[] = (
      await this.setupLinkStore.getByIndex({
        name: IndexNames.TenantProductService,
        value: dbutils.keyFromParts(tenant, product, service),
      })
    ).data;

    if (existing.length > 0 && !regenerate && !this.isExpired(existing[0])) {
      return existing[0];
    }

    // Remove the existing setup link if regenerate is true
    if (regenerate) {
      await this.setupLinkStore.delete(existing[0].setupID);
    }

    const setupLink = {
      setupID,
      tenant,
      product,
      service,
      name,
      description,
      redirectUrl,
      defaultRedirectUrl,
      validTill: +new Date(new Date().setDate(new Date().getDate() + 3)),
      url: `${process.env.NEXTAUTH_URL}/setup/${token}`,
    };

    await this.setupLinkStore.put(
      setupID,
      setupLink,
      {
        name: IndexNames.SetupToken,
        value: token,
      },
      {
        name: IndexNames.TenantProductService,
        value: dbutils.keyFromParts(tenant, product, service),
      },
      {
        name: IndexNames.Service,
        value: service,
      },
      {
        name: IndexNames.ProductService,
        value: dbutils.keyFromParts(product, service),
      }
    );

    return setupLink;
  }

  // Get a setup link by token
  async getByToken(token: string): Promise<SetupLink> {
    if (!token) {
      throw new JacksonError('Missing setup link token', 400);
    }

    const setupLink: SetupLink[] = (
      await this.setupLinkStore.getByIndex({
        name: IndexNames.SetupToken,
        value: token,
      })
    ).data;

    if (!setupLink || setupLink.length === 0) {
      throw new JacksonError('Setup link is not found', 404);
    }

    if (this.isExpired(setupLink[0])) {
      throw new JacksonError('Setup link is expired', 401);
    }

    return setupLink[0];
  }

  /**
   * @swagger
   * parameters:
   *   setupLinkId:
   *     name: id
   *     description: Setup link ID
   *     in: path
   *     required: true
   *     type: string
   * /api/v1/setup-links/{id}:
   *   delete:
   *     summary: Delete a Setup Link by ID
   *     parameters:
   *       - $ref: '#/parameters/setupLinkId'
   *     operationId: delete-setup-link
   *     tags: [Setup Link]
   *     responses:
   *      200:
   *        description: Success
   *        schema:
   *          type: object
   *          example:
   *           {
   *             data: {}
   *           }
   */
  async remove(key: string): Promise<boolean> {
    if (!key) {
      throw new JacksonError('Missing setup link key', 400);
    }

    await this.setupLinkStore.delete(key);

    return true;
  }

  // Check if a setup link is expired or not
  isExpired(setupLink: SetupLink): boolean {
    return setupLink.validTill < +new Date();
  }

  /**
   * @swagger
   * parameters:
   *   serviceParamGet:
   *     name: service
   *     description: Service name (sso or dsync)
   *     in: query
   *     required: true
   *     type: string
   *   tenantParamGet:
   *     name: tenant
   *     description: Tenant
   *     in: query
   *     required: true
   *     type: string
   *   productParamGet:
   *     name: product
   *     description: Product
   *     in: query
   *     required: true
   *     type: string
   * /api/v1/setup-links:
   *   get:
   *     summary: Get the Setup Link for a tenant and product
   *     parameters:
   *       - $ref: '#/parameters/serviceParamGet'
   *       - $ref: '#/parameters/tenantParamGet'
   *       - $ref: '#/parameters/productParamGet'
   *     operationId: set-setup-link-by-tenant-product-service
   *     tags: [Setup Link]
   *     responses:
   *      200:
   *        description: Success
   *        schema:
   *          $ref:  '#/definitions/SetupLink'
   * /api/v1/setup-links/product:
   *   get:
   *     summary: Get the Setup Links for a product
   *     parameters:
   *       - $ref: '#/parameters/productParamGet'
   *     operationId: set-setup-link-by-product
   *     tags: [Setup Link]
   *     responses:
   *      200:
   *        description: Success
   *        schema:
   *          type: array
   *          items:
   *            $ref:  '#/definitions/SetupLink'
   */
  async filterBy(params: FilterByParams): Promise<{ data: SetupLink[]; pageToken?: string }> {
    const { tenant, product, service, pageOffset, pageLimit, pageToken } = params;

    let index: Index | null = null;

    // By service
    if (tenant && product && service) {
      index = {
        name: IndexNames.TenantProductService,
        value: dbutils.keyFromParts(tenant, product, service),
      };
    }

    // By product + service
    else if (product && service) {
      index = {
        name: IndexNames.ProductService,
        value: dbutils.keyFromParts(product, service),
      };
    }

    // By service
    else if (service) {
      index = {
        name: IndexNames.Service,
        value: service,
      };
    }

    if (!index) {
      throw new JacksonError('Please provide either service or product to filter setup links', 400);
    }

    const { data: setupLinks, pageToken: nextPageToken } = await this.setupLinkStore.getByIndex(
      index,
      pageOffset,
      pageLimit,
      pageToken
    );

    if (index.name === IndexNames.TenantProductService && setupLinks.length === 0) {
      throw new JacksonError('Setup link is not found', 404);
    }

    return { data: setupLinks, pageToken: nextPageToken };
  }

  /**
   * @swagger
   * parameters:
   *   idParamGet:
   *     name: id
   *     description: Setup Link ID
   *     in: path
   *     required: true
   *     type: string
   * /api/v1/setup-links/{id}:
   *   get:
   *     summary: Get the Setup Link by ID
   *     parameters:
   *       - $ref: '#/parameters/idParamGet'
   *     operationId: get-setup-link-by-id
   *     tags: [Setup Link]
   *     responses:
   *      200:
   *        description: Success
   *        schema:
   *          $ref:  '#/definitions/SetupLink'
   */
  async get(id: string): Promise<SetupLink> {
    if (!id) {
      throw new JacksonError('Missing setup link id', 400);
    }

    const setupLink = await this.setupLinkStore.get(id);

    if (!setupLink) {
      throw new JacksonError('Setup link is not found', 404);
    }

    return setupLink;
  }
}
