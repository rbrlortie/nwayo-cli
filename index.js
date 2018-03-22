//--------------------------------------------------------
//-- CLI bootstrap
//--------------------------------------------------------
'use strict';

// We disable global require rule to optimize the speed of the CLI for unrelated workflow stuff
/* eslint-disable global-require */

const chalk    = require('chalk');
const findUp   = require('find-up');
const fs       = require('fs');
const yaml     = require('js-yaml');
const minimist = require('minimist');
const path     = require('path');


const CONFIG   = 'nwayo.yaml';
const PKG      = 'package.json';
const WORKFLOW = '@absolunet/nwayo-workflow';


//-- Flag helper
const argv = minimist(process.argv.slice(2));

const flag = (name) => {
	if (Object.keys(argv).length === 2 && argv._.length === 0) {
		if (name === 'completion-logic') {
			return argv[name];
		}

		return argv[name] === true;
	}

	return false;
};


//-- Check for updates and be obnoxious about it
const obnoxiousNotificator = (pkg) => {
	const updateNotifier = require('update-notifier');
	updateNotifier({ pkg:pkg, updateCheckInterval:1 }).notify();
};


//-- Nano wrappers to refrain the use of packages
const echo = (msg) => {
	console.log(msg);  // eslint-disable-line no-console
};

const exit = (msg) => {
	if (msg && !argv['completion-logic']) {
		const terminal = require('@absolunet/terminal');
		terminal.exit(msg);
	} else {
		process.exit();  // eslint-disable-line no-process-exit
	}
};






module.exports = () => {

	const cliPkg = require(`./${PKG}`);


	//-- Trap `-v` or `--version`
	if (flag('v') || flag('version')) {
		echo(cliPkg.version);
		exit();

	//-- Trap `--completion`
	} else if (flag('completion')) {
		echo(fs.readFileSync(`${__dirname}/completion/bash`, 'utf8'));
		exit();
	}


	//-- Set nwayo root
	const configFilepath = findUp.sync(CONFIG, { cwd:process.cwd() });
	let config;
	let root = process.cwd();

	if (configFilepath !== null) {
		config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));

		if (config && config.root) {
			root = path.normalize(`${path.dirname(configFilepath)}/${config.root}`);
		} else {
			exit(`No root defined in ${chalk.underline(CONFIG)}`);
		}
	}


	//-- Search for 'package.json'
	const projetPkgPath = `${root}/${PKG}`;
	let projetPkg;

	if (fs.existsSync(projetPkgPath)) {
		projetPkg = require(projetPkgPath);
	} else if (config) {
		exit(`No ${chalk.underline(PKG)} found under root defined in ${chalk.underline(CONFIG)}`);
	} else {
		exit(`No ${chalk.underline(CONFIG)} or ${chalk.underline(PKG)} found`);
	}


	//-- Trap `nwayo install workflow`
	const nodeModules = `${root}/node_modules`;
	const npmInstall = () => {
		const fss      = require('@absolunet/fss');
		const terminal = require('@absolunet/terminal');

		fss.del(nodeModules);
		fss.del(`${root}/package-lock.json`);

		terminal.run(`
			cd ${root}
			npm install
		`);
	};

	if (Object.keys(argv).length === 1 && argv._.length === 2 && argv._[0] === 'install' && argv._[1] === 'workflow') {
		npmInstall();
		exit();
	}


	//-- Are dependencies installed ?
	if (fs.existsSync(nodeModules)) {

		//-- If uses workflow as a package
		if (projetPkg.dependencies && projetPkg.dependencies[WORKFLOW]) {

			const workflow = `${nodeModules}/${WORKFLOW}`;

			// If workflow package is present
			if (fs.existsSync(workflow)) {

				//-- Trap `--completion-logic`
				const completion = flag('completion-logic');
				if (completion) {

					const completionLogic = `${workflow}/completion`;
					if (fs.existsSync(completionLogic)) {
						echo(require(`${workflow}/completion`)({ completion, root }));
					} else {
						echo(require(`./legacy/completion`)({ completion, root }));
					}
					exit();
				}

				//-- Let's do this
				obnoxiousNotificator(cliPkg);

				require(`${workflow}/cli`)({

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
				exit(`Workflow not installed\nPlease run ${chalk.underline('nwayo install workflow')}`);
			}

		//-- Ricochet to legacy
		} else {

			//-- Trap `--completion-logic`
			const completion = flag('completion-logic');
			if (completion) {
				echo(require(`./legacy/completion`)({ completion, root }));
				exit();
			}

			//-- Let's do this
			obnoxiousNotificator(cliPkg);
			echo(chalk.yellow(`\n [Legacy mode]\n\n`));
			require('./legacy')({ root });
		}

	// Duuuuude.... Install the workflow
	} else {
		exit(`Workflow not installed\nPlease run ${chalk.underline('nwayo install workflow')}`);
	}

};

/* eslint-enable global-require */
