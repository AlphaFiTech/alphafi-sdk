import { getExecStuff } from "./utils";
import {
  zapDepositQuoteTxb,
  zapDepositTxb,
} from "../src/transactions/zapDeposit";
import { SevenKGateway } from "../src/transactions/7k";
import { Transaction } from "@mysten/sui/transactions";

async function runTest() {
  const { address, suiClient, keypair } = getExecStuff();
  console.log("address", address);

  const sevenKGateway = new SevenKGateway();
  const tx = new Transaction();
  const quote = await sevenKGateway.getQuote(
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    "0x2::sui::SUI",
    "100000",
  );
  console.log("quote", quote);

  const swapTx = await sevenKGateway.getTransactionBlock(
    tx,
    "0x3b6a4a3bfb813689e483e7e1a3f89d1fc04562d12059868ad20f7b3f49eadca8",
    quote,
    100,
  );

  if (tx) {
    tx.setGasBudget(1_00_000_000n);
    await suiClient
      .signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
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
}

runTest();
