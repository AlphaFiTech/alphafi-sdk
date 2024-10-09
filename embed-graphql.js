const fs = require("fs");
const path = require("path");
//const chokidar = require("chokidar");

const filesToEmbed = [
  {
    source: path.resolve(__dirname, "./src/graphql/queries/userVaults.graphql"),
    target: path.resolve(__dirname, "./src/graphql/queries/userVaults.ts"),
    variableName: "userVaults",
  },
  {
    source: path.resolve(
      __dirname,
      "./src/graphql/queries/userVaultBalances.graphql",
    ),
    target: path.resolve(
      __dirname,
      "./src/graphql/queries/userVaultBalances.ts",
    ),
    variableName: "userVaultBalances",
  },
  {
    source: path.resolve(__dirname, "./src/graphql/queries/pools.graphql"),
    target: path.resolve(__dirname, "./src/graphql/queries/pools.ts"),
    variableName: "pools",
  },
  {
    source: path.resolve(__dirname, "./src/graphql/queries/investors.graphql"),
    target: path.resolve(__dirname, "./src/graphql/queries/investors.ts"),
    variableName: "investors",
  },
  {
    source: path.resolve(__dirname, "./src/graphql/queries/cetusPools.graphql"),
    target: path.resolve(__dirname, "./src/graphql/queries/cetusPools.ts"),
    variableName: "cetusPools",
  },
  {
    source: path.resolve(
      __dirname,
      "./src/graphql/queries/autoCompoundEvents.graphql",
    ),
    target: path.resolve(
      __dirname,
      "./src/graphql/queries/autoCompoundEvents.ts",
    ),
    variableName: "autoCompoundEvents",
  },
  {
    source: path.resolve(__dirname, "./src/graphql/queries/nftHolders.graphql"),
    target: path.resolve(__dirname, "./src/graphql/queries/nftHolders.ts"),
    variableName: "nftHolders",
  },
  {
    source: path.resolve(
      __dirname,
      "./src/graphql/queries/receiptData.graphql",
    ),
    target: path.resolve(__dirname, "./src/graphql/queries/receiptData.ts"),
    variableName: "receiptData",
  },
  {
    source: path.resolve(
      __dirname,
      "./src/graphql/queries/lockedTableDataFragment.graphql",
    ),
    target: path.resolve(
      __dirname,
      "./src/graphql/queries/lockedTableDataFragment.ts",
    ),
    variableName: "lockedTableDataFragment",
  },
  {
    source: path.resolve(
      __dirname,
      "./src/graphql/queries/lockedTableData.graphql",
    ),
    target: path.resolve(__dirname, "./src/graphql/queries/lockedTableData.ts"),
    variableName: "lockedTableData",
  },
];

function embedGraphQL() {
  filesToEmbed.forEach(({ source, target, variableName }) => {
    const content = fs.readFileSync(source, "utf-8");
    const tsContent = `export const ${variableName} = \`${content}\`;`;
    fs.writeFileSync(target, tsContent);
    console.log(`Embedded ${path.basename(source)} into ${target}`);
  });
}

// Run initially
embedGraphQL();

// Watch for changes in GraphQL files and re-embed
// chokidar.watch(filesToEmbed.map((f) => f.source)).on("change", embedGraphQL);
