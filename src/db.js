import { find } from 'lodash';
import moment from 'moment';

import bootstrapData from '../data/init.json';

const data = bootstrapData;

export const STATE = Object.freeze({
	PENDING: 'PENDING',
	IN_PROGRESS: 'IN_PROGRESS',
	HALTED: 'HALTED',
	DONE: 'DONE'
});

export function getJob(id) {
	return find(data.jobs, j => j.id === id);
}

export function setJobState(id, newState) {
	const job = getJob(id)
	job.state = newState
	job.stateHistory.push({
		state: newState,
		ts: getTimestamp()
	})
}

export function getTimestamp() {
	return moment();
}

export function getState() {
  return data
}