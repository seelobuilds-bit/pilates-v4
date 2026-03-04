import { calculateChurnRate } from "./retention"

export const REPORTING_CHURN_DEFINITION = "inactive clients / total clients"

export function buildChurnMeta(churnedClients: number, totalClients: number, decimals = 1) {
  return {
    churnRate: calculateChurnRate(churnedClients, totalClients, decimals),
    churnDefinition: REPORTING_CHURN_DEFINITION,
  }
}

export function buildEmptyChurnMeta() {
  return {
    churnRate: 0,
    churnDefinition: REPORTING_CHURN_DEFINITION,
  }
}
