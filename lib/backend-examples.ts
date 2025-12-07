
export const TEMPORAL_WORKFLOW_EXAMPLE = `
// workflow.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

// Configure activities with retry policies
const { sendEmail, updateShopifyOrder, logToSheets } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    maximumInterval: '1m',
    backoffCoefficient: 2,
    maximumAttempts: 5
  }
});

export async function automationWorkflow(payload: any): Promise<void> {
  const { orderId, customerEmail, amount } = payload;

  // Step 1: Update Source System
  try {
    await updateShopifyOrder(orderId, { status: 'processing' });
  } catch (err) {
    // Custom error handling or compensation logic
    throw err;
  }

  // Step 2: Artificial Delay (Durable sleep - survives crashes)
  await sleep('1 hour');

  // Step 3: Parallel Execution
  await Promise.all([
    sendEmail({ to: customerEmail, subject: 'Order Processing' }),
    logToSheets({ spreadsheetId: '123', row: [orderId, amount, 'processing'] })
  ]);
}
`;

export const ACTIVITY_EXAMPLE = `
// activities.ts
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function logToSheets(args: { spreadsheetId: string, row: string[] }): Promise<void> {
  // Idempotency check could go here
  const doc = new GoogleSpreadsheet(args.spreadsheetId);
  await doc.useServiceAccountAuth(process.env.GOOGLE_CREDS);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow(args.row);
  
  console.log(\`Added row to \${args.spreadsheetId}\`);
}
`;

export const CONNECTOR_SDK_EXAMPLE = `
// sdk/types.ts

// 1. Definition Interface
export interface ConnectorDefinition {
  id: string;
  name: string;
  version: string;
  authType: 'oauth2' | 'apikey' | 'none';
  triggers: TriggerDefinition[];
  actions: ActionDefinition[];
}

// 2. Implementation Interface
export interface ConnectorImplementation {
  // Hook to validate credentials
  testConnection: (creds: any) => Promise<boolean>;
  
  // Map of action handlers
  actions: Record<string, (input: any, context: Context) => Promise<any>>;
  
  // Webhook handlers for triggers
  webhooks: Record<string, (req: Request) => Promise<StandardizedEvent[]>>;
}

// 3. Example Implementation: SendGrid
export const SendGridConnector: ConnectorImplementation = {
  testConnection: async (creds) => {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        headers: { Authorization: \`Bearer \${creds.apiKey}\` }
    });
    return res.status !== 401;
  },

  actions: {
    sendEmail: async (input, ctx) => {
      // Platform automatically injects decrypted secrets into ctx
      await client.send({
        to: input.to,
        from: 'noreply@automator.os',
        subject: input.subject,
        text: input.body
      });
      return { status: 'sent', timestamp: new Date() };
    }
  },

  webhooks: {}
};
`;
