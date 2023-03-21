import type { EventPayloadSchema, Webhook } from '../typings';
import crypto from 'crypto';
import axios from './axios';

export const createSignatureString = (secret: string, payload: EventPayloadSchema) => {
  if (!secret) {
    return '';
  }

  const timestamp = new Date().getTime();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return `t=${timestamp},s=${signature}`;
};

const createHeader = (secret: string, payload: EventPayloadSchema) => {
  return {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': createSignatureString(secret, payload),
  };
};

export const sendPayloadToWebhook = async (webhook: Webhook, payload: EventPayloadSchema) => {
  return await axios.post(webhook.endpoint, payload, {
    headers: createHeader(webhook.secret, payload),
  });
};
