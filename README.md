# HCS Example Commands

This project provides a set of tools for using Hashgraph Online standards. It includes functionality for creating indexed and non-indexed topics, submitting messages to topics, and performing various operations such as registering, deleting, updating, and migrating topics.

## Features

1. Create Indexed HCS-2 Topics
2. Create Non-Indexed HCS-2 Topics
3. Submit Messages to HCS-2 Topics
4. Perform Operations:
   - Register a topic
   - Delete a topic
   - Update a topic
   - Migrate a topic

## Prerequisites

- Node.js (v20 or later recommended)
- npm (comes with Node.js)
- A Hedera account with an Operator ID and Private Key

## Setup

1. Clone this repository:

   ```
   git clone https://github.com/your-username/hcs-2-topic-management.git
   cd hcs-2-topic-management
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```
   OPERATOR_ID=your-operator-id
   OPERATOR_PRIVATE_KEY=your-operator-private-key
   HEDERA_NETWORK=testnet  # or mainnet
   ```

   Replace `your-operator-id` and `your-operator-private-key` with your actual Hedera account details.

## Usage

### Create an Indexed HCS-2 Topic

Run the following command and follow the prompts:

```
node examples/create-indexed-topic-id.js
```

This script will:

- Prompt for a Time-to-live (TTL) value
- Ask if you want to use a submit key
- Create an indexed HCS-2 topic with the specified parameters

### Create a Non-Indexed HCS-2 Topic

Run the following command and follow the prompts:

```
node examples/create-non-indexed-topic-id.js
```

This script will:

- Prompt for a Time-to-live (TTL) value
- Ask if you want to use a submit key
- Create a non-indexed HCS-2 topic with the specified parameters

### Submit a Message to an HCS-2 Topic

Run the following command and follow the prompts:

```
node examples/submit-message-to-hcs2-topic.js
```

This script will:

- Prompt for the HCS-2 Topic ID
- Ask if you want to use a submit key
- Allow you to choose an operation (register, delete, update, or migrate)
- Prompt for operation-specific details
- Submit the message to the specified topic


