import { Injectable } from '@nestjs/common';
import * as Chessalyzer from 'chessalyzer.js';
import * as Heatmaps from './HeatmapConfig.js';

@Injectable()
export class AnalyzeService {
	private Trackers: object;
	private db: Array<object>;

	constructor() {
		// get the base trackers
		const baseTrackers = Chessalyzer.Tracker;

		// build the tracker list; key = Class name of Tracker
		this.Trackers = {};
		Object.keys(baseTrackers).forEach(key => {
			this.Trackers[baseTrackers[key].name] = baseTrackers[key];
		});

		// init db (TODO: load saved db)
		this.db = [];
	}

	// return a list of all available trackers
	getAvailableAnalyzers(): Array<string> {
		return Object.keys(this.Trackers);
	}

	getAvailableHeatmaps(): Array<string> {
		return Object.keys(Heatmaps);
	}

	// return a list of all available trackers
	getDbInfo(): Array<object> {
		const info = [];

		this.db.forEach(entry => {
			const obj = {};
			obj['cntMoves'] = entry['cntMoves'];
			obj['cntGames'] = entry['cntGames'];
			obj['trackers'] = Object.keys(entry['trackerData']);
			info.push(obj);
		});
		return info;
	}

	// main analysis function
	async analyze(
		path: string,
		trackers: Array<string>,
		nGames: number
	): Promise<number> {
		// create new trackers
		const trackerArray: Array<any> = [];
		trackers.forEach(t => {
			trackerArray.push(new this.Trackers[t]());
		});

		// analyze
		const result = await Chessalyzer.startBatchMultiCore(
			path,
			trackerArray,
			{
				cntGames: nGames
			}
		);

		// add to db
		const analysis: object = {};
		analysis['trackerData'] = {};
		analysis['cntGames'] = result.cntGames;
		analysis['cntMoves'] = result.cntMoves;
		trackerArray.forEach(t => {
			analysis['trackerData'][t.constructor.name] = t;
		});

		this.db.push(analysis);

		return this.db.length - 1;
	}

	generateHeatmap(id: number, name: string, square: string) {
		const { type, calc } = Heatmaps[name];
		const tracker = this.db[id]['trackerData'][type];
		return Chessalyzer.generateHeatmap(tracker, square, calc);
	}
}
