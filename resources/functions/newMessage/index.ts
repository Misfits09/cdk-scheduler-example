import { DynamoDB } from "@aws-sdk/client-dynamodb";
const dynamo = new DynamoDB({
  region: process.env.SCHEDULER_REGION,
});

//Send message in 20 minutes
const DEFAULT_DELAY = 20 * 60000;

export const handler = async function (event: any) {
  const message = event?.queryStringParameters?.message || "No message found";

  let delay = parseInt(event?.queryStringParameters?.minutes) * 60000;
  if (Number.isNaN(delay)) delay = DEFAULT_DELAY;

  const response = await dynamo.putItem({
    TableName: process.env.SCHEDULER_TABLE_NAME || "TABLE_NOT_FOUND",
    Item: {
      pk: { S: process.env.SCHEDULER_PK || "PK_NOT_FOUND" },
      sk: { S: `${Date.now() + delay}#${Math.floor(Math.random() * 1000)}` },
      payload: {
        M: {
          MessageContent: { S: message },
        },
      },
    },
  });

  return {
    statusCode: response.$metadata.httpStatusCode,
    body: "Completed",
  };
};
