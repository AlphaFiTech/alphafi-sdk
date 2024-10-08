export const lockedTableDataFragment = `fragment TableDynamicFields on owner {
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
`;