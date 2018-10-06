// TODO: Figure this out.
const SPOT_INST_PRICE = 11.60
const ON_DEMAND_PRICE = 12.90

export async function getCurrentOnDemandPrice() {
  // TODO: fetch from AWS APIs
  return ON_DEMAND_PRICE
}

export async function getCurrentSpotPrice() {
  // TODO: fetch from AWS APIs
  return SPOT_INST_PRICE
}

export async function startInstance(job) {
  // Verify that we will be able to store a GPU instance at this price point.
  if (job.thresholdPrice <= await getCurrentSpotPrice()) return;

  // TODO: Start GPU instance
  console.log(`TODO: starting instance for job: ${job.id}`)
}

export async function stopInstance(id) {
  // TODO: Stop GPU instance
  console.log(`TODO: stopping instance: ${id}`)
}

