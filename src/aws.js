import AWS from 'aws-sdk'
import moment from 'moment';
import { last, orderBy } from 'lodash'
import { getTimestamp } from './db'

// All GPU instance types on AWS. These prices are for Linux on us-east-1.
// See: https://aws.amazon.com/ec2/pricing/on-demand/
import instanceTypes from '../data/instances.json'
import { getTime } from 'date-fns';

// All currently supported GPU instance types on AWS
export const supportedInstanceType = "p2.xlarge"
export const supportedAvailabilityZone = "us-east-1a"
export const supportedRegion = "us-east-1"

AWS.config.setPromisesDependency(null);
const ec2 = new AWS.EC2({apiVersion: '2016-11-15', region: supportedRegion });

let spotInstancePriceHistory = []
let mockedPriceHistory = []

export async function getOnDemandPrice() {
  return instanceTypes[supportedInstanceType].price
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotPriceHistory-property
export async function loadSpotPriceHistory() {
  // If we mocked the price history, we don't want to overwrite it with more recent data points.
  if (mockedPriceHistory.length > 0) return;

  const data = await ec2.describeSpotPriceHistory({
    AvailabilityZone: supportedAvailabilityZone,
    InstanceTypes: [supportedInstanceType],
    DryRun: false,
    MaxResults: 100,
    ProductDescriptions: [
      'Linux/UNIX'
    ],
    StartTime: getTimestamp(moment().add(-10, 'days')),
    EndTime: getTimestamp()
  }).promise()

  const history = data.SpotPriceHistory || []

  spotInstancePriceHistory = orderBy(history.map(({ SpotPrice, Timestamp }) => ({
    price: Number(SpotPrice),
    ts: getTimestamp(Timestamp)
  })), 'ts', 'asc')

  console.log(`Fetched spot instance price history. Current price: $${await getCurrentSpotPrice()} (${supportedAvailabilityZone}, ${supportedInstanceType})`)

  return spotInstancePriceHistory
}

export function getCurrentSpotPrice() {
  return last(spotInstancePriceHistory).price
}

export function getSpotInstancePriceHistory() {
  return [...spotInstancePriceHistory, ...mockedPriceHistory]
}

export function addMockSpotInstancePrice(price) {
  mockedPriceHistory.push({
    price,
    ts: getTimestamp(),
  })
}

export function clearMockedSpotInstancePrices() {
  mockedPriceHistory = []
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

