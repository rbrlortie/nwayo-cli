//--------------------------------------------------------
//-- CLI bootstrap
//--------------------------------------------------------
'use strict';

const chalk          = require('chalk');
const findUp         = require('find-up');
const fs             = require('fs');
const minimist       = require('minimist');
const path           = require('path');
const updateNotifier = require('update-notifier');
const yaml           = require('js-yaml');



/* eslint-disable no-console, global-require */
module.exports = () => {

	const pkg = require('./package');

	// Check for updates and be obnoxious about it
	updateNotifier({ pkg:pkg, updateCheckInterval:1 }).notify();

	// If nwayo config
	const configFilepath = findUp.sync('nwayo.yaml', { cwd:process.cwd() });

	if (configFilepath !== null) {
		const config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));
		const cwd    = path.normalize(`${path.dirname(configFilepath)}/${config.root}`);

		require(`${cwd}/node_modules/@absolunet/nwayo-workflow/cli`)({
			config: config,
			cwd:    cwd,
			infos:  {
				version: pkg.version,
				path:    __dirname
			}
		});

	// Legacy
	} else {

		const argv = minimist(process.argv.slice(2));

		if (argv.v || argv.version) {
			console.log(pkg.version);

		} else if (argv.completion) {
			console.log(fs.readFileSync(`${__dirname}/completion/bash`, 'utf8'));

		} else {

			console.log(chalk.yellow(` [Legacy mode]\n\n`));
			require('./legacy')();
		}
	}

};
