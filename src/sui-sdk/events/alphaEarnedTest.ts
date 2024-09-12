import suiClient from "../client"
import fs from "fs"


async function tests() {
    // const result = await suiClient.queryEvents({
    //     limit:1,
    //     cursor: null,
    //     query: {
    //         // MoveEventType: "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphapool::LiquidityChangeEvent",
    //         MoveEventType: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::DepositEvent"
    //     }
    // })
    // // process.stdout.write(JSON.stringify(result));
    // fs.writeFileSync("./test.json", JSON.stringify(result))

    type PoolAmounts = {
        amount: number;
        pool: string;
    };

    type UsersInvestmentsToPools = {
        [owner: string]: PoolAmounts;
    };

    function filterInvestmentsByOwners(
        investments: UsersInvestmentsToPools,
        owners: string[]
    ): UsersInvestmentsToPools {
        return Object.fromEntries(
            owners
                .filter((owner) => owner in investments) // Filter only owners that exist in investments
                .map((owner) => [owner, investments[owner]]) // Create array entries from matching owners
        );
    }

    // Example usage:
    const userInvestments: UsersInvestmentsToPools = {
        "owner1": { amount: 100, pool: "ALPHA" },
        "owner2": { amount: 200, pool: "USDC-SUI" },
        "owner3": { amount: 150, pool: "WETH-USDC" }
    };

    const ownersToKeep = ["owner1", "owner3"];

    const filteredInvestments = filterInvestmentsByOwners(userInvestments, ownersToKeep);

    console.log(filteredInvestments);
    // Output: { owner1: { amount: 100, pool: "ALPHA" }, owner3: { amount: 150, pool: "WETH-USDC" } }

}

tests()