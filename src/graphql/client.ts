// src/graphql/client.ts

/* This file will contain the setup for the Apollo Client:
 */

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://sui-mainnet.mystenlabs.com/graphql",
  }),
  cache: new InMemoryCache(),
});

export default client;
