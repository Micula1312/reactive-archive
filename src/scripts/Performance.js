import performance01 from "../performances/performance-01/index.js";
import elisa from "../performances/elisa/index.js";
import { normalizePerformance } from "./Cue.js";

export const performances = {
  "performance-01": normalizePerformance(performance01),
  elisa: normalizePerformance(elisa)
};

const requestedPerformance = new URLSearchParams(window.location.search).get("performance");
const selectedId = requestedPerformance && performances[requestedPerformance]
  ? requestedPerformance
  : "performance-01";

export const performanceId = selectedId;
export const performance = performances[selectedId];
export default performance;
