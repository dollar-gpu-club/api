import cron from 'node-cron'
import { find } from 'lodash'

import { STATE, getState } from './db'
import { startInstance, haltedInstances } from './aws'

function schedule({ name, freq, fn }) {
  cron.schedule(freq, () => {
    console.log(`Executing task: ${name} (${freq})`);
    fn()
  });
}

const crons = () => {
  console.log('Initializing cronjobs...')

  // Every 5 seconds.
  schedule({
    name: 'Poll Jobs',
    freq: '*/10 * * * * *',
    fn: pollJobs
  })
}

const pollJobs = async () => {
  const { jobs } = getState()

  // TODO: check instances for halted jobs
  // const haltedJobs = haltedInstances().map(i => find(instances, inst => inst.))
  
  const startableJobs = jobs.filter(j => j.state === STATE.PENDING || j.state === STATE.HALTED)
  if (startableJobs.length > 0) {
    console.log(`Starting ${startableJobs.length} jobs...`)
    
    await Promise.all(startableJobs.map(startInstance))

    console.log('Done starting jobs.')
  }
}

export default crons