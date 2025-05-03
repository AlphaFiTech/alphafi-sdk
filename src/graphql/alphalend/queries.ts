import { gql } from "@apollo/client";

import { alphalendTvlQuery } from "./queries/tvl.js";

export const GET_ALPHALEND_TVL = gql`
  ${alphalendTvlQuery}
`;
