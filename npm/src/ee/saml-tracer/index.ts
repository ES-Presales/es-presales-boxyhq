import { Storable } from '../../typings';
import { generateMnemonic } from '@boxyhq/error-code-mnemonic';
import { IndexNames } from '../../controller/utils';
import { keyFromParts } from '../../db/utils';

const INTERVAL_1_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INTERVAL_1_DAY_MS = 24 * 60 * 60 * 1000;

type Trace = {
  traceId: string;
  timestamp: number;
  error: string;
  context: {
    tenant: string;
    product: string;
    clientID: string;
    [key: string]: unknown;
  };
};

class SAMLTracer {
  tracerStore: Storable;

  constructor({ db }) {
    this.tracerStore = db.store('saml:tracer');
    // Clean up stale traces at the start
    this.cleanUpStaleTraces();
    // Set timer to run every day
    setInterval(async () => {
      this.cleanUpStaleTraces();
    }, INTERVAL_1_DAY_MS);
  }

  public async saveTrace(payload: Omit<Trace, 'traceId'>) {
    const { context } = payload;
    // Friendly trace id
    const traceId = await generateMnemonic();
    await this.tracerStore.put(
      traceId,
      { ...payload, traceId },
      {
        name: IndexNames.TenantProduct,
        value: keyFromParts(context.tenant, context.product),
      },
      { name: IndexNames.SSOClientID, value: context.clientID }
    );
  }

  public async getAllTraces(pageOffset?: number, pageLimit?: number): Promise<Trace[]> {
    return (await this.tracerStore.getAll(pageOffset, pageLimit)) as Trace[];
  }

  /** Cleans up stale traces older than 1 week */
  public async cleanUpStaleTraces() {
    let traces: Trace[] = [];
    for (let pageOffset = 0; ; pageOffset++) {
      const page = await this.getAllTraces(pageOffset, 50);
      if (page.length === 0) {
        break;
      }
      traces = traces.concat(page.filter(({ timestamp }) => Date.now() - timestamp > INTERVAL_1_WEEK_MS));
    }

    for (let i = 0; i < traces.length; i++) {
      await this.tracerStore.delete(traces[i].traceId);
    }
  }
}

export default SAMLTracer;
