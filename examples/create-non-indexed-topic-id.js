import dotenv from 'dotenv';
dotenv.config();
import { Client, TopicCreateTransaction, PrivateKey } from '@hashgraph/sdk';
import { number, confirm } from '@inquirer/prompts';

/**
 * Create a non-indexed HCS-2 Topic
 * @param {number} ttl - The Time-to-live (TTL) in seconds
 * @param {boolean} useSubmitKey - Whether to use a submit key
 */
async function createNonIndexedHCS2Topic(ttl, useSubmitKey) {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);

  const isTestnet = process.env.HEDERA_NETWORK === 'testnet';
  const clientBase = isTestnet ? Client.forTestnet() : Client.forMainnet();
  const client = clientBase.setOperator(operatorId, operatorKey);

  try {
    let transaction = new TopicCreateTransaction().setTopicMemo(
      `hcs-2:1:${ttl}`
    );

    let submitKey;
    if (useSubmitKey) {
      submitKey = PrivateKey.generate();
      transaction = transaction.setSubmitKey(submitKey);
    }

    transaction = transaction.freezeWith(client);

    const submitTx = await transaction.execute(client);
    const receipt = await submitTx.getReceipt(client);

    console.log(`\n=== HCS-2 Non-Indexed Topic Created Successfully ===`);
    console.log(`Topic ID       : ${receipt.topicId}`);
    console.log(`TTL            : ${ttl} seconds`);
    if (useSubmitKey) {
      console.log(`Submit Key     : ${submitKey.toString()}`);
      console.log(`Submit Key Pub : ${submitKey.publicKey.toString()}`);
    } else {
      console.log('Submit Key     : Not used');
    }
    console.log('========================================\n');
  } catch (error) {
    console.error('Error creating HCS-2 topic:', error);
  } finally {
    client.close();
  }
}

async function promptUser() {
  const ttl = await number({
    message: 'Enter the Time-to-live (TTL) in seconds:',
    default: 86400,
    validate: (value) => {
      if (isNaN(value)) {
        return 'Please enter a valid number';
      }
      return value > 0 || 'Please enter a positive number';
    },
  });

  const useSubmitKey = await confirm({
    message: 'Do you want to use a submit key?',
    default: false,
  });

  return { ttl, useSubmitKey };
}

async function main() {
  try {
    const { ttl, useSubmitKey } = await promptUser();
    await createNonIndexedHCS2Topic(ttl, useSubmitKey);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

main();
