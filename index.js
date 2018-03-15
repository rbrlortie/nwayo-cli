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


const CONFIG   = 'nwayo.yaml';
const PKG      = 'package.json';
const WORKFLOW = '@absolunet/nwayo-workflow';






module.exports = () => {

	const cliPkg = require(`./${PKG}`);  // eslint-disable-line global-require

	//-- Check for updates and be obnoxious about it
	updateNotifier({ pkg:cliPkg, updateCheckInterval:1 }).notify();


	//-- Global stuff
	const argv = minimist(process.argv.slice(2));

	// Version
	if (argv.v || argv.version) {
		terminal.echo(cliPkg.version);
		terminal.exit();

	// Completion
	} else if (argv.completion) {
		terminal.echo(fss.readFile(`${__dirname}/completion/bash`, 'utf8'));
		terminal.exit();
	}


	//-- Set nwayo root
	const configFilepath = findUp.sync(CONFIG, { cwd:process.cwd() });
	let config;
	let root = process.cwd();

	if (configFilepath !== null) {
		config = yaml.safeLoad(fss.readFile(configFilepath, 'utf8'));

		if (config && config.root) {
			root = path.normalize(`${path.dirname(configFilepath)}/${config.root}`);
		} else {
			terminal.exit(`No root defined in ${chalk.underline(CONFIG)}`);
		}
	}



	//-- Search for package.json
	const projetPkgPath = `${root}/${PKG}`;
	let projetPkg;

	if (fss.exists(projetPkgPath)) {
		projetPkg = require(projetPkgPath);  // eslint-disable-line global-require
	} else if (config) {
		terminal.exit(`No ${chalk.underline(PKG)} found under root defined in ${chalk.underline(CONFIG)}`);
	} else {
		terminal.exit(`No ${chalk.underline(CONFIG)} or ${chalk.underline(PKG)} found`);
	}


	//-- Trap 'nwayo install workflow'
	const nodeModules = `${root}/node_modules`;
	const npmInstall = () => {
		fss.del(nodeModules);
		fss.del(`${root}/package-lock.json`);

		terminal.run(`
			cd ${root}
			npm install
		`);
	};

	if (Object.keys(argv).length === 1 && argv._.length === 2 && argv._[0] === 'install' && argv._[1] === 'workflow') {
		npmInstall();
		terminal.exit();
	}


	//-- Are dependencies installed ?
	if (fss.exists(nodeModules)) {

		//-- If uses workflow as a package
		if (projetPkg.dependencies && projetPkg.dependencies[WORKFLOW]) {

			const workflow = `${nodeModules}/${WORKFLOW}`;

			// If workflow package is present
			if (fss.exists(workflow)) {
				require(`${workflow}/cli`)({  // eslint-disable-line global-require

					// nwayo-workflow < 3.5.0
					cwd:    root,
					infos:  {
						version: cliPkg.version,
						path:    __dirname
					},

					// nwayo-workflow >= 3.5.0
					cliPkg:            cliPkg,
					cliPath:           __dirname,
					workflowInstaller: npmInstall

				});

			// Duuuuude.... Install the workflow
			} else {
				terminal.exit(`Workflow not installed\nPlease run ${chalk.underline('nwayo install workflow')}`);
			}

		//-- Ricochet to legacy
		} else {
			terminal.echo(chalk.yellow(`\n [Legacy mode]\n\n`));
			require('./legacy')({ root });  // eslint-disable-line global-require
		}

	// Duuuuude.... Install the workflow
	} else {
		terminal.exit(`Workflow not installed\nPlease run ${chalk.underline('nwayo install workflow')}`);
	}

};
