export type IdPConfig = {
  defaultRedirectUrl: string;
  redirectUrl: string[] | string;
  tenant: string;
  product: string;
  name: string;
  description: string;
  rawMetadata?: string;
  encodedRawMetadata?: string;
};

export interface IAPIController {
  config(body: IdPConfig): Promise<any>;
  updateConfig(body: any): Promise<any>;
  getConfig(body: { clientID?: string; tenant?: string; product?: string }): Promise<any>;
  deleteConfig(body: {
    clientID?: string;
    clientSecret?: string;
    tenant?: string;
    product?: string;
  }): Promise<void>;
}

export interface IOAuthController {
  authorize(body: OAuthReqBody): Promise<{ redirect_url?: string; authorize_form?: string }>;
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url?: string; app_select_form?: string }>;
  token(body: OAuthTokenReq): Promise<OAuthTokenRes>;
  userInfo(token: string): Promise<Profile>;
}

export interface IAdminController {
  getAllConfig(pageOffset?: number, pageLimit?: number);
}

export interface IHealthCheckController {
  status(): Promise<{
    status: number;
  }>;
  init(): Promise<void>;
}

export interface ILogoutController {
  createRequest(body: SLORequestParams): Promise<{ logoutUrl: string | null; logoutForm: string | null }>;
  handleResponse(body: SAMLResponsePayload): Promise<any>;
}

export interface OAuthReqBody {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  state: string;
  tenant?: string;
  product?: string;
  access_type?: string;
  scope?: string;
  code_challenge: string;
  code_challenge_method: 'plain' | 'S256' | '';
  provider: 'saml';
  idp_hint?: string;
}

export interface SAMLResponsePayload {
  SAMLResponse: string;
  RelayState: string;
  idp_hint?: string;
}

export interface OAuthTokenReq {
  client_id: string;
  client_secret: string;
  code_verifier: string;
  code: string;
  grant_type: 'authorization_code';
}

export interface OAuthTokenRes {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  requested: Record<string, string>;
}

export interface Index {
  name: string;
  value: string;
}

export interface DatabaseDriver {
  getAll(namespace: string, pageOffset?: number, pageLimit?: number): Promise<unknown[]>;
  get(namespace: string, key: string): Promise<any>;
  put(namespace: string, key: string, val: any, ttl: number, ...indexes: Index[]): Promise<any>;
  delete(namespace: string, key: string): Promise<any>;
  getByIndex(namespace: string, idx: Index): Promise<any>;
}

export interface Storable {
  getAll(pageOffset?: number, pageLimit?: number): Promise<unknown[]>;
  get(key: string): Promise<any>;
  put(key: string, val: any, ...indexes: Index[]): Promise<any>;
  delete(key: string): Promise<any>;
  getByIndex(idx: Index): Promise<any>;
}

export interface DatabaseStore {
  store(namespace: string): Storable;
}

export interface Encrypted {
  iv?: string;
  tag?: string;
  value: string;
}

export type EncryptionKey = any;

export type DatabaseEngine = 'redis' | 'sql' | 'mongo' | 'mem';

export type DatabaseType = 'postgres' | 'mysql' | 'mariadb';

export interface DatabaseOption {
  engine?: DatabaseEngine;
  url?: string;
  type?: DatabaseType;
  ttl?: number;
  cleanupLimit?: number;
  encryptionKey?: string;
  pageLimit?: number;
}

export interface JacksonOption {
  externalUrl: string;
  samlPath: string;
  samlAudience?: string;
  preLoadedConfig?: string;
  idpEnabled?: boolean;
  db: DatabaseOption;
  clientSecretVerifier?: string;
  idpDiscoveryPath?: string;
  scimPath?: string;
}

export interface SLORequestParams {
  nameId: string;
  tenant: string;
  product: string;
  redirectUrl?: string;
}

interface Metadata {
  sso: {
    postUrl?: string;
    redirectUrl: string;
  };
  slo: {
    redirectUrl?: string;
    postUrl?: string;
  };
  entityID: string;
  thumbprint: string;
  loginType: 'idp' | 'sp';
  provider: string;
}

export interface SAMLConfig {
  idpMetadata: Metadata;
  certs: {
    privateKey: string;
    publicKey: string;
  };
  defaultRedirectUrl: string;
}

// See Error Response section in https://www.oauth.com/oauth2-servers/authorization/the-authorization-response/
export interface OAuthErrorHandlerParams {
  error:
    | 'invalid_request'
    | 'access_denied'
    | 'unauthorized_client'
    | 'unsupported_response_type'
    | 'invalid_scope'
    | 'server_error'
    | 'temporarily_unavailable';
  error_description: string;
  redirect_uri: string;
}

export type DirectorySyncEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'group.created'
  | 'group.updated'
  | 'group.deleted'
  | 'group.user_added'
  | 'group.user_removed';

export interface Base {
  store(type: 'groups' | 'members' | 'users'): Storable;
  setTenant(tenant: string): this;
  setProduct(product: string): this;
  setTenantAndProduct(tenant: string, product: string): this;
  with(tenant: string, product: string): this;
  createId(): string;
}

export interface Users extends Base {
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: User[] | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: User | null; error: ApiError | null }>;
  search(userName: string): Promise<{ data: User[] | null; error: ApiError | null }>;
  delete(id: string): Promise<{ data: null; error: ApiError | null }>;
  clear(): Promise<void>;
  create(param: {
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    raw: any;
  }): Promise<{ data: User | null; error: ApiError | null }>;
  update(
    id: string,
    param: {
      first_name: string;
      last_name: string;
      email: string;
      active: boolean;
      raw: object;
    }
  ): Promise<{ data: User | null; error: ApiError | null }>;
}

export interface Groups extends Base {
  create(param: { name: string; raw: any }): Promise<{ data: Group | null; error: ApiError | null }>;
  removeAllUsers(groupId: string): Promise<void>;
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: Group[] | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: Group | null; error: ApiError | null }>;
  getAllUsers(groupId: string): Promise<{ user_id: string }[]>;
  delete(id: string): Promise<{ data: null; error: ApiError | null }>;
  addUserToGroup(groupId: string, userId: string): Promise<void>;
  isUserInGroup(groupId: string, userId: string): Promise<boolean>;
  removeUserFromGroup(groupId: string, userId: string): Promise<void>;
  search(displayName: string): Promise<{ data: Group[] | null; error: ApiError | null }>;
  update(
    id: string,
    param: {
      name: string;
      raw: any;
    }
  ): Promise<{ data: Group | null; error: ApiError | null }>;
}

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  active: boolean;
  raw?: any;
};

export type Group = {
  id: string;
  name: string;
  raw?: any;
};

export enum DirectorySyncProviders {
  'azure-scim-v2' = 'Azure SCIM v2.0',
  'onelogin-scim-v2' = 'OneLogin SCIM v2.0',
  'okta-scim-v2' = 'Okta SCIM v2.0',
  'jumpcloud-scim-v2' = 'JumpCloud v2.0',
}

export type DirectoryType = keyof typeof DirectorySyncProviders;

export type HTTPMethod = 'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';

export type Directory = {
  id: string;
  name: string;
  tenant: string;
  product: string;
  type: DirectoryType;
  log_webhook_events: boolean;
  scim: {
    path: string;
    endpoint?: string;
    secret: string;
  };
  webhook: {
    endpoint: string;
    secret: string;
  };
};

export type DirectorySyncGroupMember = { value: string; email?: string };

export interface DirectoryConfig {
  create({
    name,
    tenant,
    product,
    webhook_url,
    webhook_secret,
    type,
  }: {
    name?: string;
    tenant: string;
    product: string;
    webhook_url?: string;
    webhook_secret?: string;
    type: DirectoryType;
  }): Promise<{ data: Directory | null; error: ApiError | null }>;
  update(
    id: string,
    param: Omit<Partial<Directory>, 'id' | 'tenant' | 'prodct' | 'scim'>
  ): Promise<{ data: Directory | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: Directory | null; error: ApiError | null }>;
  getByTenantAndProduct(
    tenant: string,
    product: string
  ): Promise<{ data: Directory | null; error: ApiError | null }>;
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: Directory[] | null; error: ApiError | null }>;
  delete(id: string): Promise<void>;
}

export interface IDirectoryUsers {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(user: User): Promise<DirectorySyncResponse>;
  update(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse>;
  patch(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse>;
  delete(directory: Directory, user: User, active: boolean): Promise<DirectorySyncResponse>;
  getAll(queryParams: { count: number; startIndex: number; filter?: string }): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest, eventCallback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface IDirectoryGroups {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(group: Group): Promise<DirectorySyncResponse>;
  updateDisplayName(directory: Directory, group: Group, body: any): Promise<Group>;
  delete(directory: Directory, group: Group): Promise<DirectorySyncResponse>;
  getAll(queryParams: { filter?: string }): Promise<DirectorySyncResponse>;
  addGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[] | undefined,
    sendWebhookEvent: boolean
  ): Promise<void>;
  removeGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[],
    sendWebhookEvent: boolean
  ): Promise<void>;
  addOrRemoveGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[]
  ): Promise<void>;
  update(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse>;
  patch(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest, eventCallback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface IWebhookEventsLogger extends Base {
  log(directory: Directory, event: DirectorySyncEvent): Promise<WebhookEventLog>;
  getAll(): Promise<WebhookEventLog[]>;
  get(id: string): Promise<WebhookEventLog>;
  clear(): Promise<void>;
  delete(id: string): Promise<void>;
  updateStatus(log: WebhookEventLog, statusCode: number): Promise<WebhookEventLog>;
}

export type DirectorySyncResponse = {
  status: number;
  data?: any;
};

export interface DirectorySyncRequestHandler {
  handle(request: DirectorySyncRequest, callback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface Events {
  handle(event: DirectorySyncEvent): Promise<void>;
}

export interface DirectorySyncRequest {
  method: HTTPMethod;
  body: any | undefined;
  directoryId: Directory['id'];
  resourceType: 'users' | 'groups';
  resourceId: string | undefined;
  apiSecret: string | null;
  query: {
    count?: number;
    startIndex?: number;
    filter?: string;
  };
}

export type DirectorySync = {
  requests: DirectorySyncRequestHandler;
  directories: DirectoryConfig;
  groups: Groups;
  users: Users;
  events: { callback: EventCallback };
  webhookLogs: IWebhookEventsLogger;
  providers: () => {
    [K in string]: string;
  };
};

export interface ApiError {
  message: string;
  code: number;
}

export interface DirectorySyncEvent {
  directory_id: Directory['id'];
  event: DirectorySyncEventType;
  data: User | Group | (User & { group: Group });
  tenant: string;
  product: string;
}

export interface EventCallback {
  (event: DirectorySyncEvent): Promise<void>;
}

export interface WebhookEventLog extends DirectorySyncEvent {
  id: string;
  webhook_endpoint: string;
  created_at: Date;
  status_code?: number;
  delivered?: boolean;
}
