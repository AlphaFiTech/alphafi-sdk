async function main(){
const result = await suiClient.queryEvents({
    limit:1,
    cursor: null,
    query: {
        MoveEventType: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::DepositEvent"
    }
})
}