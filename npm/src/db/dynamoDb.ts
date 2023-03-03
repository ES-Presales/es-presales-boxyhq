import {
  BatchWriteItemCommand,
  WriteRequest,
  BatchGetItemCommand,
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall, NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { DatabaseDriver, DatabaseOption, Encrypted, Index } from '../typings';
import * as dbutils from './utils';

const getSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

const tableName = 'jacksonStore';
const indexTableName = 'jacksonIndex';
const globalStoreKeyIndexName = 'storeKeyIndex';
const globalIndexKeyIndexName = 'indexKeyIndex';

class DynamoDB implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: DynamoDBClient;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<DynamoDB> {
    this.client = new DynamoDBClient({ endpoint: this.options.url });
    try {
      await this.client.send(
        new CreateTableCommand({
          KeySchema: [
            {
              AttributeName: 'namespace',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'key',
              KeyType: 'RANGE',
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'namespace',
              AttributeType: 'S',
            },
            {
              AttributeName: 'key',
              AttributeType: 'S',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          TableName: tableName,
        })
      );
      await this.client.send(
        new UpdateTimeToLiveCommand({
          TableName: tableName,
          TimeToLiveSpecification: {
            AttributeName: 'expiresAt',
            Enabled: true,
          },
        })
      );

      await this.client.send(
        new CreateTableCommand({
          KeySchema: [
            {
              AttributeName: 'key',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'storeKey',
              KeyType: 'RANGE',
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'namespace',
              AttributeType: 'S',
            },
            {
              AttributeName: 'key',
              AttributeType: 'S',
            },
            {
              AttributeName: 'storeKey',
              AttributeType: 'S',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: globalIndexKeyIndexName,
              KeySchema: [
                {
                  AttributeName: 'key',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
            {
              IndexName: globalStoreKeyIndexName,
              KeySchema: [
                {
                  AttributeName: 'storeKey',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          TableName: indexTableName,
        })
      );
    } catch (error: any) {
      if (!error?.message?.includes('Cannot create preexisting table')) {
        throw error;
      }
    }
    return this;
  }

  // internal get without dbutils.Key
  async _get(namespace: string, key: string): Promise<any> {
    const res = await this.client.send(
      new GetItemCommand({ Key: marshall({ namespace, key }), TableName: tableName })
    );

    // Double check that the item has not expired
    const now = getSeconds(new Date());

    const item = res.Item ? unmarshall(res.Item) : null;

    if (item?.expiresAt < now) {
      return null;
    }

    if (item && item.value) {
      return JSON.parse(item.value);
    }

    return null;
  }

  async get(namespace: string, key: string): Promise<any> {
    return this._get(namespace, dbutils.key(namespace, key));
  }

  async getAll(namespace: string, pageOffset?: number, pageLimit?: number): Promise<unknown[]> {
    const res = await this.client.send(
      new QueryCommand({
        KeyConditionExpression: 'namespace = :namespace',
        ExpressionAttributeValues: marshall({ namespace }),
        TableName: tableName,
        Limit: pageLimit,
      })
    );

    console.log(pageOffset, res);

    return [];
  }

  async getByIndex(namespace: string, idx: Index, pageOffset?: number, pageLimit?: number): Promise<any> {
    console.log(pageOffset, pageLimit);
    const res = await this.client.send(
      new QueryCommand({
        KeyConditionExpression: '#key = :key',
        ExpressionAttributeNames: {
          '#key': 'key',
        },
        ExpressionAttributeValues: {
          ':key': { S: dbutils.keyForIndex(namespace, idx) },
        },
        TableName: indexTableName,
        IndexName: globalIndexKeyIndexName,
      })
    );

    const items: Encrypted[] = [];
    for (const item of res.Items || []) {
      const ns = item.namespace?.S;
      const sk = item.storeKey?.S;
      if (ns && sk) {
        const val = await this._get(ns, sk); // use internal get to avoid double keying
        if (val) {
          items.push({
            value: val.value,
            iv: val.iv,
            tag: val.tag,
          });
        }
      }
    }

    return items;
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
    const dbKey = dbutils.key(namespace, key);
    const now = getSeconds(new Date());
    const doc: Record<string, NativeAttributeValue> = {
      namespace,
      key: dbKey,
      value: JSON.stringify(val),
      createdAt: now,
    };

    if (ttl) {
      const ttlDate = new Date(Date.now() + ttl * 1000);
      doc.expiresAt = getSeconds(ttlDate);
    }

    const indexWrites: WriteRequest[] = [];
    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      const idxKey = dbutils.keyForIndex(namespace, idx);

      indexWrites.push({
        PutRequest: {
          Item: marshall({
            namespace,
            key: idxKey,
            storeKey: dbKey,
          }),
        },
      });
    }

    if (indexWrites.length > 0) {
      const reqItems: Record<string, WriteRequest[]> = {};
      reqItems[indexTableName] = indexWrites;
      await this.client.send(
        new BatchWriteItemCommand({
          RequestItems: reqItems,
        })
      );
    }

    await this.client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(doc),
      })
    );
  }

  async delete(namespace: string, key: string): Promise<any> {
    const res = await this.client.send(
      new DeleteItemCommand({ TableName: tableName, Key: marshall({ namespace, key }) })
    );

    // const res = await this.client.send(
    //   new QueryCommand({
    //     KeyConditions: {
    //       storeKey: {
    //         ComparisonOperator: 'EQ',
    //         AttributeValueList: [
    //           {
    //             S: dbutils.keyForIndex(namespace, idx),
    //           },
    //         ],
    //       },
    //     },
    //     // KeyConditionExpression: 'storeKey = :storeKey',
    //     // ExpressionAttributeValues: {
    //     //   // ':namespace': { S: namespace },
    //     //   ':storeKey': { S: dbutils.keyForIndex(namespace, idx) },
    //     // },
    //     TableName: indexTableName,
    //     IndexName: globalStoreKeyIndexName,
    //   })
    // );

    return res;
  }
}

export default {
  new: async (options: DatabaseOption): Promise<DynamoDB> => {
    return await new DynamoDB(options).init();
  },
};
