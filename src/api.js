import expressPromiseRouter from 'express-promise-router'

import { stopInstance } from './aws'

let api = expressPromiseRouter();

api.post('/jobs', (req, res) => {
  res.json({})
})

api.post('/prices', (req, res) => {
  res.json({})
})

api.post('/metrics', (req, res) => {
  res.json({})
})

api.post('/halt/:jobId', async (req, res) => {
  await stopInstance(req.params.jobId)

  res.json({})
})

export default api