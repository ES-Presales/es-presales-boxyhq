import crypto from 'crypto';
import axios from 'axios';
import type {
  Storable,
  JacksonOption,
  Records,
  LLMConfigMergedFromVault,
  LLMProvidersType,
} from '../../typings';
import * as dbutils from '../../db/utils';
import { IndexNames } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { LLMChat, LLMConfig, LLMConfigPayload, LLMConversation, PII_POLICY_OPTIONS } from './types';
import { JacksonError } from '../../controller/error';
import { LLM_PROVIDERS } from './llm-providers';

export class ChatController {
  private chatStore: Storable;
  private conversationStore: Storable;
  private llmConfigStore: Storable;
  private opts: JacksonOption;

  constructor({
    chatStore,
    conversationStore,
    llmConfigStore,
    opts,
  }: {
    chatStore: Storable;
    conversationStore: Storable;
    llmConfigStore: Storable;
    opts: JacksonOption;
  }) {
    this.llmConfigStore = llmConfigStore;
    this.chatStore = chatStore;
    this.conversationStore = conversationStore;
    this.opts = opts;
  }

  private async getLLMConfigsByTenant(tenant: string): Promise<LLMConfig[]> {
    return (await this.llmConfigStore.getByIndex({ name: IndexNames.Tenant, value: tenant })).data;
  }

  public async getLLMConfigFromVault(
    tenant: string,
    token: string
  ): Promise<{
    apiKey: string;
    baseURL: string;
    piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
  }> {
    const res = await axios.get(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data?token=${token}`,
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.read}` } }
    );

    if (res.data[token]) {
      return JSON.parse(res.data[token]?.data);
    } else {
      throw new JacksonError('Config not found in Vault', 404);
    }
  }

  public async getLLMConfigs(tenant: string): Promise<LLMConfigMergedFromVault[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const configs = await this.getLLMConfigsByTenant(tenant);
    for (let i = 0; i < configs.length; i++) {
      const data = await this.getLLMConfigFromVault(tenant, configs[i].terminusToken);
      if (data) {
        configs[i] = {
          ...configs[i],
          baseURL: data.baseURL,
          apiKey: '*'.repeat(data.apiKey.length),
          piiPolicy: data.piiPolicy,
        } as any;
      }
    }
    return configs as LLMConfigMergedFromVault[];
  }

  public async getLLMConfigsByTenantAndProvider(tenant: string, provider: string): Promise<LLMConfig[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return (
      await this.llmConfigStore.getByIndex({
        name: IndexNames.TenantProvider,
        value: dbutils.keyFromParts(tenant, provider),
      })
    ).data;
  }

  private async storeLLMConfig(config: Omit<LLMConfig, 'id'>) {
    const id = crypto.randomBytes(20).toString('hex');
    await this.llmConfigStore.put(
      id,
      config,
      // secondary index on tenant
      { name: IndexNames.Tenant, value: config.tenant },
      // secondary index on tenant + provider
      { name: IndexNames.TenantProvider, value: dbutils.keyFromParts(config.tenant, config.provider) }
    );
    return { id, ...config };
  }

  private async saveLLMConfigInVault({
    tenant,
    apiKey,
    baseURL,
    piiPolicy,
  }: {
    tenant: string;
    apiKey?: string;
    baseURL?: string;
    piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
  }): Promise<string | undefined> {
    const res = await axios.post(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data/llm-config`,
      {
        apiKey: apiKey || '',
        baseURL: baseURL || '',
        piiPolicy,
      },
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` } }
    );

    if (res.data?.token) {
      return res.data.token;
    }
  }

  public async createLLMConfig(llmConfig: LLMConfigPayload): Promise<LLMConfig> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!llmConfig.apiKey && llmConfig.provider !== 'ollama') {
      throw new Error('API Key is required');
    }

    const vaultResult = await this.saveLLMConfigInVault(llmConfig);
    const config = await this.storeLLMConfig({
      provider: llmConfig.provider,
      models: llmConfig.models || [],
      terminusToken: vaultResult || '',
      tenant: llmConfig.tenant,
    });

    return config;
  }

  private async updateLLMConfigInVault({
    tenant,
    token,
    apiKey,
    baseURL,
    piiPolicy,
  }: {
    tenant: string;
    token: string;
    apiKey?: string;
    baseURL?: string;
    piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
  }) {
    await axios.put(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data/llm-config?token=${token}`,
      {
        apiKey: apiKey || '',
        baseURL: baseURL || '',
        piiPolicy,
      },
      {
        headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` },
      }
    );
  }

  public async updateLLMConfig(configId: string, llmConfig: LLMConfigPayload): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const config = await this.llmConfigStore.get(configId);
    if (!config) {
      throw new JacksonError('Config not found', 404);
    }

    const configFromVault = await this.getLLMConfigFromVault(config.tenant, config.terminusToken);
    if (!configFromVault) {
      throw new JacksonError('Config not found in Vault', 404);
    }

    await this.updateLLMConfigInVault({
      token: config.terminusToken,
      tenant: config.tenant,
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.baseURL,
      piiPolicy: llmConfig.piiPolicy,
    });

    await this.llmConfigStore.put(configId, {
      ...config,
      provider: llmConfig.provider,
      models: llmConfig.models || [],
    });
  }

  public async deleteLLMConfig({ configId, tenant }: { configId: string; tenant: string }): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);
    const config = await this.llmConfigStore.get(configId);
    if (!config) {
      throw new JacksonError('Config not found', 404);
    }
    await this.llmConfigStore.delete(configId);
    await axios.delete(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data/llm-config?token=${config.terminusToken}`,
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` } }
    );
  }

  public async getConversationsByTenantAndUser({
    tenant,
    userId,
  }: {
    tenant: string;
    userId: string;
  }): Promise<Records<LLMConversation>> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const _index = { name: IndexNames.TenantUser, value: dbutils.keyFromParts(tenant, userId) };

    const conversations = (await this.conversationStore.getByIndex(_index)) as Records<LLMConversation>;

    return conversations;
  }

  public async getConversationById(conversationId: string): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversation = (await this.conversationStore.get(conversationId)) as LLMConversation;

    return conversation;
  }

  public async createConversation(conversation: Omit<LLMConversation, 'id'>): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversationID = crypto.randomBytes(20).toString('hex');

    const _index = {
      name: IndexNames.TenantUser,
      value: dbutils.keyFromParts(conversation.tenant, conversation.userId),
    };

    await this.conversationStore.put(conversationID, conversation, _index);

    return { id: conversationID, ...conversation };
  }

  public async createChat(chat: Omit<LLMChat, 'id' | 'createdAt'>): Promise<LLMChat> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const chatID = crypto.randomBytes(20).toString('hex');

    const createdAt = Date.now();

    await this.chatStore.put(
      chatID,
      { ...chat, createdAt },
      { name: IndexNames.LLMConversation, value: chat.conversationId }
    );

    return { id: chatID, createdAt, ...chat };
  }

  public async getChatThreadByConversationId(conversationId: string): Promise<LLMChat[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversation = await this.getConversationById(conversationId);

    if (!conversation) {
      throw new JacksonError('Conversation not found', 404);
    }

    const chat = (
      await this.chatStore.getByIndex({
        name: IndexNames.LLMConversation,
        value: conversationId,
      })
    ).data as LLMChat[];

    return chat;
  }

  public async getLLMProviders(): Promise<LLMProvidersType> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return LLM_PROVIDERS;
  }
}
