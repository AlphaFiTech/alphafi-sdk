import { fromB64 } from "@mysten/bcs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

import * as dotenv from "dotenv";
import { Transaction } from "@mysten/sui/transactions";

dotenv.config();

export function getExecStuff() {
  if (!process.env.PK_B64) {
    throw new Error("env var PK_B64 not configured");
  }

  const b64PrivateKey = process.env.PK_B64 as string;
  const keypair = Ed25519Keypair.fromSecretKey(fromB64(b64PrivateKey).slice(1));
  const address = `${keypair.getPublicKey().toSuiAddress()}`;

  if (!process.env.NETWORK) {
    throw new Error("env var NETWORK not configured");
  }

  const suiClient = new SuiClient({
    url: getFullnodeUrl(
      process.env.NETWORK as "mainnet" | "testnet" | "devnet" | "localnet",
    ),
  });

  return { address, keypair, suiClient };
}

export async function executeTransactionBlock(txb: Transaction) {
  const { keypair, suiClient } = getExecStuff();

  await suiClient
    .signAndExecuteTransaction({
      signer: keypair,
      transaction: txb,
      requestType: "WaitForLocalExecution",
      options: {
        showEffects: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    })
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch((error) => {
      console.error(error);
    });
}

export async function dryRunTransactionBlock(txb: Transaction) {
  const { suiClient, address } = getExecStuff();
  txb.setSender(address);
  try {
    let serializedTxb = await txb.build({ client: suiClient });
    suiClient
      .dryRunTransactionBlock({
        transactionBlock: serializedTxb,
      })
      .then((res) => {
        console.log(JSON.stringify(res, null, 2));
        // console.log(res.effects.status, res.balanceChanges);
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (e) {
    console.log(e);
  }
}

export async function simulateTransactionBlock(
  txb: Transaction,
  address: string,
) {
  const { suiClient } = getExecStuff();
  txb.setSender(address);
  try {
    // suiClient
    //   .devInspectTransactionBlock({
    //     transactionBlock: txb,
    //     sender: address,
    //   })
    //   .then((res) => {
    //     console.log(JSON.stringify(res, null, 2));
    //     // console.log(res.effects.status, res.balanceChanges);
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
    await suiClient
      .devInspectTransactionBlock({
        transactionBlock: txb,
        sender: address,
      })
      .then((res) => {
        console.log(JSON.stringify(res, null, 2));
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (e) {
    console.log(e);
  }
}
