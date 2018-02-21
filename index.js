//--------------------------------------------------------
//-- CLI bootstrap
//--------------------------------------------------------
'use strict';

const chalk          = require('chalk');
const findUp         = require('find-up');
const yaml           = require('js-yaml');
const minimist       = require('minimist');
const path           = require('path');
const updateNotifier = require('update-notifier');
const fss            = require('@absolunet/fss');
const terminal       = require('@absolunet/terminal');






module.exports = () => {

	const pkg = require('./package');  // eslint-disable-line global-require

	// Check for updates and be obnoxious about it
	updateNotifier({ pkg:pkg, updateCheckInterval:1 }).notify();

	// If nwayo config
	const configFilepath = findUp.sync('nwayo.yaml', { cwd:process.cwd() });

	if (configFilepath !== null) {
		const config   = yaml.safeLoad(fss.readFile(configFilepath, 'utf8'));
		const cwd      = path.normalize(`${path.dirname(configFilepath)}/${config.root}`);
		const workflow = `${cwd}/node_modules/@absolunet/nwayo-workflow`;

		if (fss.exists(workflow)) {
			require(`${workflow}/cli`)({  // eslint-disable-line global-require

				// nwayo-workflow < 3.5.0
				cwd:    cwd,
				infos:  {
					version: pkg.version,
					path:    __dirname
				},

				// nwayo-workflow >= 3.5.0
				cliPkg:  pkg,
				cliPath: __dirname

			});

		} else {
			terminal.exit(`Workflow not installed\nPlease run ${chalk.underline('nwayo install workflow')}`);
		}


	// Legacy
	} else {

		const argv = minimist(process.argv.slice(2));

		if (argv.v || argv.version) {
			terminal.echo(pkg.version);

		} else if (argv.completion) {
			terminal.echo(fss.readFile(`${__dirname}/completion/bash`, 'utf8'));

		} else {

			terminal.echo(chalk.yellow(` [Legacy mode]\n\n`));
			require('./legacy')();  // eslint-disable-line global-require
		}
	}

};
