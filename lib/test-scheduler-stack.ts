import { Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { Scheduler } from "cdk-scheduler";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class TestSchedulerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myScheduler = new Scheduler(this, "myScheduler");

    const newMessageHandler = new NodejsFunction(this, "NewMessageLambda", {
      entry: `${__dirname}/../resources/functions/newMessage/index.ts`,
      environment: {
        SCHEDULER_PK: myScheduler.partitionKeyValue,
        SCHEDULER_TABLE_NAME: myScheduler.schedulerTable.tableName,
        SCHEDULER_REGION: this.region,
      },
    });

    const api = new apigateway.RestApi(this, "NewMessageApi", {
      restApiName: "New Message API",
      description: "This service appends a new message to your Scheduler.",
    });

    const apiIntegration = new apigateway.LambdaIntegration(newMessageHandler);
    api.root.addMethod("GET", apiIntegration);

    myScheduler.schedulerTable.grantWriteData(newMessageHandler);

    const triggeredEventHandler = new NodejsFunction(
      this,
      "TriggeredEventLambda",
      {
        entry: `${__dirname}/../resources/functions/triggeredEvent/index.ts`,
        environment: {
          SCHEDULER_PK: myScheduler.partitionKeyValue,
          SCHEDULER_TABLE_NAME: myScheduler.schedulerTable.tableName,
          SCHEDULER_REGION: this.region,
        },
      }
    );

    const eventSource = new SqsEventSource(myScheduler.schedulingQueue);
    triggeredEventHandler.addEventSource(eventSource);
  }
}
