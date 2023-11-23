import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';

import jackson from '@lib/jackson';
import { retracedOptions } from '@lib/env';
import type { AuditEventType } from 'types/retraced';

interface ReportEventParams extends Event {
  action: AuditEventType;
  productId: string;
}

// Cache retraced client
let client: Retraced.Client | null = null;

// Create a Retraced client
const getClient = async () => {
  if (!retracedOptions.hostUrl || !retracedOptions.apiKey || !retracedOptions.projectId) {
    return;
  }

  if (client) {
    return client;
  }

  client = new Retraced.Client({
    endpoint: retracedOptions.hostUrl,
    apiKey: retracedOptions.apiKey,
    projectId: retracedOptions.projectId,
  });

  return client;
};

// Send an event to Retraced
const reportEvent = async ({ action, crud, group, actor, productId }: ReportEventParams) => {
  try {
    const retracedClient = await getClient();

    if (!retracedClient) {
      return;
    }

    const { checkLicense, productController } = await jackson();

    if (!(await checkLicense())) {
      throw new Error('BoxyHQ license not valid. Cannot report event to Retraced.');
    }

    const retracedEvent: Event = {
      action,
      crud,
      group,
      actor,
    };

    // Find team info for the product
    if (productId && !group) {
      try {
        const productInfo = await productController.get(productId);

        retracedEvent.group = {
          id: productInfo.teamId,
          name: productInfo.teamName,
        };
      } catch (err: any) {
        console.error('Error getting product info', err);
      }
    }

    await retracedClient.reportEvent(retracedEvent);
  } catch (err: any) {
    console.error('Error reporting event to Retraced', err);
  }
};

const retraced = {
  getClient,
  reportEvent,
};

export default retraced;
