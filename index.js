//--------------------------------------------------------
//-- CLI bootstrap
//--------------------------------------------------------
'use strict';

const chalk    = require('chalk');
const findUp   = require('find-up');
const fs       = require('fs');
const minimist = require('minimist');
const path     = require('path');
const yaml     = require('js-yaml');





/* eslint-disable no-console, global-require */
module.exports = () => {

	const { version } = require('./package');
	const argv        = minimist(process.argv.slice(2));

	if (argv.v || argv.version) {
		console.log(version);

	} else if (argv.completion) {
		console.log(`completion mumbo jumbo`);

	} else {

		const configFilepath = findUp.sync('nwayo.yaml', { cwd:process.cwd() });

		// If nwayo config
		if (configFilepath !== null) {
			const config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));
			const cwd    = path.normalize(`${path.dirname(configFilepath)}/${config.root}`);

			require(`${cwd}/node_modules/@absolunet/nwayo-workflow/cli`)({
				config: config,
				cwd:    cwd,
				infos:  {
					version: version,
					path:    __dirname
				}
			});

		// Legacy
		} else {
			console.log(chalk.yellow(` [Legacy mode]\n\n`));
			require('./legacy')();
		}
	}

};

