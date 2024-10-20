export function getMultiReceiptsQuery(receiptTypes: any) {
  let query = `
    query GetUserVaultBalances($address: SuiAddress!) {
      owner(address: $address) {`;

  Object.keys(receiptTypes).forEach((key) => {
    if (receiptTypes[key].cursor === "") {
      query += `
        ${key}: objects(
          filter: {
            type: "${receiptTypes[key].type}"
          }
          first: 10
        ) {
          ...ReceiptFields
        }`;
    } else if (receiptTypes[key].cursor !== "0") {
      query += `
        ${key}: objects(
          filter: {
            type: "${receiptTypes[key].type}"
            after: "${receiptTypes[key].cursor}"
          }
          first: 10
        ) {
          ...ReceiptFields
        }`;
    }
  });

  query += `
      }
    }
    
    fragment ReceiptFields on MoveObjectConnection {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        address
        version
        digest
        hasPublicTransfer
        contents {
          type {
            repr
          }
          json
        }
      }
    }
    `;
  return query;
}
