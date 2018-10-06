import expressPromiseRouter from 'express-promise-router';
import { celebrate, Joi, errors } from 'celebrate';
import { find } from 'lodash';
import moment from 'moment';
import uuid from 'uuid/v4';

import bootstrapData from '../data/init.json';
import { stopInstance, ON_DEMAND_PRICE } from './aws';

let api = expressPromiseRouter();

const data = bootstrapData;

const STATE = Object.freeze({
	PENDING: 'PENDING',
	IN_PROGRESS: 'IN_PROGRESS',
	HALTED: 'HALTED',
	DONE: 'DONE'
});

function getJob(id) {
	return find(data.jobs, j => j.id === id);
}

function setJobState(id, newState) {
	const job = getJob(id)
	job.state = newState
	job.stateHistory.push({
		state: newState,
		ts: getTimestamp()
	})
}

function getTimestamp() {
	return moment();
}

/** Get the full application state. */
api.get('/state', (req, res) => {
	res.json(data);
});

/** Post a new Job. */
api.post(
	'/jobs',
	celebrate({
		body: {
			id: Joi.string(),
			command: Joi.string().required(),
			thresholdPrice: Joi.number().required(),
			code: Joi.string().required(),
			description: Joi.string()
		}
	}),
	(req, res) => {
		const { id, thresholdPrice, command, code, description } = req.body;
		const startTimestamp = getTimestamp();

		const job = {
			id: id || uuid(),
			state: STATE.PENDING,
			code,
			command,
			description,
			thresholdPrice,
			onDemandPrice: ON_DEMAND_PRICE,
			startTimestamp,
			training: [],
			validation: [],
			stateHistory: [
				{
					state: STATE.PENDING,
					ts: startTimestamp
				}
			]
		};

		data.jobs.push(job);

		res.json({
      job,
      msg: `Successfully added job: ${job.id}`
    })
	}
);

/** Change the per-GPU price. */
api.post(
	'/prices',
	celebrate({
		body: {
			price: Joi.number().required()
		}
	}),
	(req, res) => {
    const { price } = req.body

    data.priceHistory.push({
      price,
      ts: getTimestamp()
    })

		res.json({
      msg: `Successfully added price: ${price}`
    });
	}
);

/** Polling function to orchestrate Jobs. */
api.post('/pollJobs', async () => {
  // TODO!
  // TODO: configure this function to execute every X seconds
})

/** Post a new set of metrics for a given Job. */
api.post(
	'/:jobId/metrics',
	celebrate({
		body: {
			epoch: Joi.number().integer().required(),
			training: Joi.object({
				accuracy: Joi.number().required(),
				loss: Joi.number().required()
			}).required(),
			validation: {
				accuracy: Joi.number().required(),
				loss: Joi.number().required()
			}
    },
    params: {
      jobId: Joi.string().required()
    }
	}),
	(req, res) => {
    const { epoch, training, validation } = req.body;
    const { jobId } = req.params
    
    const job = getJob(jobId)

		job.epoch = epoch;
		job.training.push(training);
		if (validation) {
			job.validation.push(validation);
		}

		res.json({
      msg: `Successfully added metric for epoch: ${epoch}`
    });
	}
);

/** Starts a given Job. */
api.post(
	'/:jobId/start',
	celebrate({
		body: {
			numEpochs: Joi.number().integer().required()
		},
		params: {
			jobId: Joi.string().required()
		}
	}),
	(req, res) => {
		const job = getJob(req.params.jobId);

		setJobState(job.id, STATE.IN_PROGRESS)
		job.numEpochs = req.body.numEpochs;

		res.json({
      job,
      msg: `Successfully started job: ${job.id}`
    })
	}
);

/** Halt a given Job. */
api.post(
	'/:jobId/halt',
	celebrate({
		params: {
			jobId: Joi.string().required()
		}
	}),
	async (req, res) => {
		let job = getJob(req.params.jobId);

		await stopInstance(job.id);

		setJobState(job.id, STATE.HALTED)

		res.json({
      job,
      msg: `Successfully halted job: ${job.id}`
    })
	}
);

api.use(errors);

export default api;
