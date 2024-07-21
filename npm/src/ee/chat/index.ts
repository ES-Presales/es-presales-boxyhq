// import { JacksonError } from '../../controller/error';
import crypto from 'crypto';
import { throwIfInvalidLicense } from '../common/checkLicense';
import type { Storable, JacksonOption, Records } from '../../typings';
import { LLMChat, LLMConversation } from './types';
import { IndexNames } from '../../controller/utils';
import * as dbutils from '../../db/utils';

export class ChatController {
  private chatStore: Storable;
  // private configStore: Storable;
  private conversationStore: Storable;
  private opts: JacksonOption;

  constructor({
    chatStore,
    conversationStore,
    opts,
  }: {
    chatStore: Storable;
    conversationStore: Storable;
    opts: JacksonOption;
  }) {
    this.chatStore = chatStore;
    this.conversationStore = conversationStore;
    this.opts = opts;
  }

  public async getConversationsByTeamAndUser({
    teamId,
    userId,
  }: {
    teamId?: string;
    userId: string;
  }): Promise<Records<LLMConversation>> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const _index = teamId
      ? { name: IndexNames.TeamUser, value: dbutils.keyFromParts(teamId, userId) }
      : { name: IndexNames.User, value: userId };

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

    const _index = conversation.teamId
      ? {
          name: IndexNames.TeamUser,
          value: dbutils.keyFromParts(conversation.teamId, conversation.userId),
        }
      : { name: IndexNames.User, value: conversation.userId };

    await this.conversationStore.put(conversationID, conversation, _index);

    return { id: conversationID, ...conversation };
  }

  public async createChat(chat: Omit<LLMChat, 'id'>): Promise<LLMChat> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const chatID = crypto.randomBytes(20).toString('hex');

    await this.chatStore.put(chatID, chat);

    return { id: chatID, ...chat };
  }
}
