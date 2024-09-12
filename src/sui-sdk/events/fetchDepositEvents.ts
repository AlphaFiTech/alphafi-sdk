import { fetchEvents } from "./fetchEvents"
import { DepositEventNode, FetchDepositEventsParams, FetchDepositEventsResponse } from "./types"
import { poolInfo } from "../../common/maps"

// const lastInvestmentAlphaPoolDepositEvent: number = 1724074240881;
// const lastAlphaPoolDepositEvent: number = 1724077012872;
// const alphafiInception: number = 1719499980000;

export async function fetchDepositEvents(params: FetchDepositEventsParams): Promise<FetchDepositEventsResponse> {
    const eventTypesSet = new Set<string>();
    if (params.poolNames) {
        params.poolNames.forEach((poolName) => {
            const eventType = poolInfo[poolName].depositEventType;
            if (eventType !== undefined && eventType !== null && eventType !== "") {
                eventTypesSet.add(eventType);
            }
        });
    } else {
        // Iterate over all the values in poolInfo and add each depositEventType to the Set
        Object.values(poolInfo).forEach((info) => {
            const eventType = info.depositEventType;
            if (eventType !== undefined && eventType !== null && eventType !== "") {
                eventTypesSet.add(eventType);
            }
        });
    }
    const eventTypes = Array.from(eventTypesSet);

    const eventsPromises = eventTypes.map(async (eventType) => {
        const events = (
            await fetchEvents({
                startTime: params.startTime,
                endTime: params.endTime,
                eventTypes: [eventType],
            })
        )
        return events;
    });

    const events = (await Promise.all(eventsPromises)).flat();
    const depositEvents = events.map((e) => {
        return e as DepositEventNode;
    });

    return depositEvents;
}