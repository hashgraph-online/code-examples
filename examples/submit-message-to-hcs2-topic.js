import dotenv from 'dotenv';
dotenv.config();
import {
  Client,
  TopicMessageSubmitTransaction,
  PrivateKey,
} from '@hashgraph/sdk';
import { select, input, confirm } from '@inquirer/prompts';

/**
 * Submit a message to a HCS-2 Topic
 * @param {string} topicId - The HCS-2 Topic ID
 * @param {PrivateKey} submitKey - The submit key to use for the transaction
 * @param {object} message - The message to submit
 */
async function submitMessageToHCS2Topic(topicId, submitKey, message) {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);

  const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
    operatorId,
    operatorKey
  );

  try {
    // Initialize the transaction
    let tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(Buffer.from(JSON.stringify(message)));

    // If a submit key is provided, sign the transaction with it
    if (submitKey) {
      // Freeze the transaction with the client to prepare for signing
      tx = await tx.freezeWith(client);

      // Sign the transaction with the submit key
      tx = await tx.sign(submitKey);
    } else {
      // If no submit key, freeze and sign with operator key
      tx = await tx.freezeWith(client).sign(operatorKey);
    }

    // Execute the transaction
    const submitTx = await tx.execute(client);
    const receipt = await submitTx.getReceipt(client);

    console.log(`\n=== HCS-2 Message Submitted Successfully ===`);
    console.log(`Transaction ID : ${submitTx.transactionId.toString()}`);
    console.log(`Status         : ${receipt.status}`);
    console.log('============================================\n');
  } catch (error) {
    console.error('Error submitting message to HCS-2 topic:', error);
  } finally {
    client.close();
  }
}

async function promptUser() {
  // Prompt for Topic ID
  const topicId = await input({
    message: 'Enter the HCS-2 Topic ID (e.g., 0.0.123456):',
    validate: (value) =>
      /^0\.\d+\.\d+$/.test(value) || 'Please enter a valid Topic ID.',
  });

  // Prompt for Submit Key usage
  const useSubmitKey = await confirm({
    message: 'Do you want to use a submit key?',
    default: false,
  });

  let submitKey = null;
  if (useSubmitKey) {
    const keyString = await input({
      message: 'Enter your Submit Private Key:',
      validate: (value) => {
        try {
          PrivateKey.fromString(value);
          return true;
        } catch {
          return 'Please enter a valid Private Key string.';
        }
      },
    });
    submitKey = PrivateKey.fromString(keyString);
  }

  const operationChoices = [
    { name: 'Register', value: 'register' },
    { name: 'Delete', value: 'delete' },
    { name: 'Update', value: 'update' },
    { name: 'Migrate', value: 'migrate' },
  ];

  const operation = await select({
    message: 'Choose an operation to perform:',
    choices: operationChoices,
  });

  let message = {
    p: 'hcs-2',
    op: operation,
  };

  // Common Prompt: Memo
  const memo = await input({
    message: 'Enter an optional memo (max 500 characters):',
    default: '',
    validate: (value) =>
      value.length <= 500 || 'Memo must be 500 characters or less.',
  });

  if (memo) {
    message.m = memo;
  }

  // Function to prompt for metadata
  async function promptForMetadata() {
    let metadata = {};
    let continueAdding = true;

    while (continueAdding) {
      const key = await input({ message: 'Enter metadata key:' });
      const value = await input({ message: `Enter value for ${key}:` });
      metadata[key] = value;

      continueAdding = await confirm({
        message: 'Do you want to add more metadata?',
        default: false,
      });
    }

    return metadata;
  }

  // Operation-Specific Prompts
  switch (operation) {
    case 'register': {
      const t_id = await input({
        message: 'Enter the Topic ID to register (e.g., 0.0.123456):',
        validate: (value) =>
          /^0\.\d+\.\d+$/.test(value) || 'Please enter a valid Topic ID.',
      });

      const metadata = await promptForMetadata();
      if (Object.keys(metadata).length > 0) {
        message.metadata = metadata;
      }
      message.t_id = t_id;
      break;
    }

    case 'delete': {
      const uid = await input({
        message: 'Enter the UID (Sequence Number) of the message to delete:',
        validate: (value) =>
          /^\d+$/.test(value) || 'UID must be a valid number.',
      });

      message.uid = uid;
      break;
    }

    case 'update': {
      const uid = await input({
        message: 'Enter the UID (Sequence Number) of the message to update:',
        validate: (value) =>
          /^\d+$/.test(value) || 'UID must be a valid number.',
      });

      const new_t_id = await input({
        message: 'Enter the new Topic ID to register:',
        validate: (value) =>
          /^0\.\d+\.\d+$/.test(value) || 'Please enter a valid Topic ID.',
      });

      const metadata = await promptForMetadata();
      if (Object.keys(metadata).length > 0) {
        message.metadata = metadata;
      }
      message.uid = uid;
      message.t_id = new_t_id;
      break;
    }

    case 'migrate': {
      const t_id = await input({
        message: 'Enter the new Topic ID to migrate to (e.g., 0.0.654321):',
        validate: (value) =>
          /^0\.\d+\.\d+$/.test(value) || 'Please enter a valid Topic ID.',
      });

      const metadata = await promptForMetadata();
      if (Object.keys(metadata).length > 0) {
        message.metadata = metadata;
      }
      message.t_id = t_id;
      break;
    }

    default:
      console.error('Invalid operation selected.');
      process.exit(1);
  }

  return { topicId, submitKey, message };
}

async function main() {
  try {
    // Ensure required environment variables are set
    const requiredEnvVars = [
      'OPERATOR_ID',
      'OPERATOR_PRIVATE_KEY',
      'HEDERA_NETWORK',
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
      console.error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
      process.exit(1);
    }

    const { topicId, submitKey, message } = await promptUser();
    await submitMessageToHCS2Topic(topicId, submitKey, message);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

main();
