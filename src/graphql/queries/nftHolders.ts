export const nftHolders = `query GetNftHolders($before: String, $receipt: String!) {
  objects(last: 10, before: $before, filter: { type: $receipt }) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
      startCursor
    }
    nodes {
      asMoveObject {
        status
        contents {
          json
        }
      }
    }
  }
}
`;
