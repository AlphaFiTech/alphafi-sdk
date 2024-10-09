export const lockedTableData = `query GetLockedTableData(
  $limit: Int
  $after: String
  $lockedTableId: SuiAddress!
) {
  owner(address: $lockedTableId) {
    dynamicFields(first: $limit, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name {
          json
        }
        value {
          __typename
          ... on MoveValue {
            json
          }
        }
      }
    }
  }
}
`;
