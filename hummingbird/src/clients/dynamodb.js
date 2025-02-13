import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { isLocalEnv } from '../core/utils.js';
import { MEDIA_STATUS } from '../core/constants.js';

const endpoint = isLocalEnv()
  ? 'http://dynamodb.localhost.localstack.cloud:4566'
  : undefined;

/**
 * Stores metadata about a media object in DynamoDB.
 * @param {object} param0 Media metadata
 * @param {string} param0.key The media object key in S3
 * @param {number} param0.size The size of the media object in bytes
 * @param {string} param0.name The original filename of the media object
 * @param {string} param0.mimetype The MIME type of the media object
 * @return {Promise<void>}
 */
export const createMedia = async ({ key, size, name, mimetype }) => {
  const TableName = process.env.MEDIA_DYNAMODB_TABLE_NAME;
  const command = new PutItemCommand({
    TableName,
    Item: {
      PK: { S: `MEDIA#${key}` },
      SK: { S: 'METADATA' },
      size: { N: size.toString() },
      name: { S: name },
      mimetype: { S: mimetype },
      status: { S: MEDIA_STATUS.PENDING },
    },
  });

  try {
    const client = new DynamoDBClient({
      endpoint,
      region: process.env.AWS_REGION,
    });

    await client.send(command);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Gets metadata about a media object from DynamoDB.
 * @param {string} key The media object key. The same key used to store the media object in S3.
 * @return {Promise<object>} The media object metadata.
 */
export const getMedia = async (key) => {
  const TableName = process.env.MEDIA_DYNAMODB_TABLE_NAME;
  const command = new GetItemCommand({
    TableName,
    Key: {
      PK: { S: `MEDIA#${key}` },
      SK: { S: 'METADATA' },
    },
  });

  try {
    const client = new DynamoDBClient({
      endpoint,
      region: process.env.AWS_REGION,
    });

    const { Item } = await client.send(command);

    if (!Item) {
      return null;
    }

    return {
      key,
      size: Number(Item.size.N),
      name: Item.name.S,
      mimetype: Item.mimetype.S,
      status: Item.status.S,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
