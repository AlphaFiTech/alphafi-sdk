// src/graphql/client.ts

/* This file will contain the setup for the Apollo Client:
 */

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://api.alphalend.xyz/graphql",
  }),
  cache: new InMemoryCache(),
});

export default client;
