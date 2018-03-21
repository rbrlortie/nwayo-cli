//--------------------------------------------------------
//-- Completion
//--------------------------------------------------------
'use strict';

// We disable global require rule to optimize the speed of the CLI for unrelated workflow stuff
/* eslint-disable global-require */

const LEVEL1_CMDS    = ['run', 'rebuild', 'watch', 'install', 'doctor'];
const LEVEL1_FLAGS   = ['-h', '--help', '-v', '--version', '--pronounce'];
const REBUILD_FLAGS  = ['--prod'];


const bundles = () => {
	const fs = require('fs');

	const list = [];
	fs.readdirSync(`${__dirname}/stubs/`).forEach((bundleName) => {
		const [, bundle] = bundleName.match(/^([a-zA-Z0-9-]+)$/) || [];

		if (bundle) {
			list.push(bundle);

			fs.readdirSync(`${__dirname}/stubs/${bundle}`).forEach((subbundleName) => {
				const [, subbundle] = subbundleName.match(/^_([a-zA-Z0-9-]+)\.yaml$/) || [];

				if (subbundle) {
					list.push(`${bundle}:${subbundle}`);
				}
			});
		}
	});

	return list;
};


const tasks = () => {
	return ['assets', 'scripts'];
};






module.exports = (data) => {
	const items = data.split(' ');
	items.shift();

	let values = [];

	switch (items.length) {

		case 1:
			values = [].concat(LEVEL1_CMDS, LEVEL1_FLAGS);
			break;

		case 2:
			switch (items[0]) {

				case 'run':
					values = tasks();
					break;

				case 'rebuild':
					values = bundles().concat(REBUILD_FLAGS);
					break;

				case 'watch':
					values = bundles();
					break;

				case 'install':
					values = ['workflow', 'vendors'];
					break;

				default: break;

			}
			break;

		case 3:
			switch (items[0]) {

				case 'run':
					values = bundles();
					break;

				case 'rebuild':
					values = REBUILD_FLAGS;
					break;

				default: break;

			}
			break;

		default: break;

	}

	return values.join(' ');
};

/* eslint-enable global-require */
