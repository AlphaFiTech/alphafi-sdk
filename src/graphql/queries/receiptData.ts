export const receiptData = `query GetReceiptData($limit: Int, $receiptType: String!, $after: String) {
  objects(first: $limit, after: $after, filter: { type: $receiptType }) {
    nodes {
      asMoveObject {
        status
        contents {
          json
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;
