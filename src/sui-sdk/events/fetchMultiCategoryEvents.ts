import { fetchWithdrawV2Events } from "./fetchWithdrawV2Events.js";
import { fetchAutoCompoundingEvents } from "./fetchAutoCompoundingEvents.js";
import { fetchLiquidityChangeEvents } from "./fetchLiquidityChangeEvents.js";
import { EventNode } from "./types.js";

export type EventCategory =
  | "AutoCompounding"
  | "LiquidityChange"
  | "WithdrawV2";

export async function fetchMultiCategoryEvents(params: {
  eventCategories: EventCategory[];
  startTime: number;
  endTime: number;
}): Promise<Partial<Record<EventCategory, EventNode[]>>> {
  const result: Partial<Record<EventCategory, EventNode[]>> = {};
  const { eventCategories, startTime, endTime } = params;
  const promises = eventCategories.map(async (category) => {
    switch (category) {
      case "AutoCompounding":
        result["AutoCompounding"] = await fetchAutoCompoundingEvents({
          startTime,
          endTime,
        });
        break;
      case "LiquidityChange":
        result["LiquidityChange"] = await fetchLiquidityChangeEvents({
          startTime,
          endTime,
        });
        break;
      case "WithdrawV2":
        result["WithdrawV2"] = await fetchWithdrawV2Events({
          startTime,
          endTime,
        });
        break;
      default:
        return Promise.reject(
          new Error(`Unsupported event category: ${category}`),
        );
    }
  });
  await Promise.all(promises);
  return result;
}
