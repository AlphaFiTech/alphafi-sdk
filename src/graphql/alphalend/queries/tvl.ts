export const alphalendTvlQuery = `
query GetTvl {
    protocolStats {
        totalSuppliedUsd,
        totalBorrowedUsd,
    }
}`;
