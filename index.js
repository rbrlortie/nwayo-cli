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
const WORKFLOWFORK = '@rbrlortie/nwayo-workflow';


//-- CLI helper
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

const cmd = (command, optionalFlag) => {
	const [action, scope] = command.split(' ');

	if (argv._[0] === action && (
		argv._.length === 1 ||
		(argv._.length === 2 && argv._[1] === scope)
	)) {
		if (Object.keys(argv).length === 1) {
			return true;
		} else if (optionalFlag && Object.keys(argv).length === 2 && argv[optionalFlag] === true) {
			return { flag:true };
		}
	}

	return false;
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

const workflowNotInstalled = () => {
	exit(`
		Workflow not installed
		Please run ${chalk.underline('nwayo install workflow')}
	`);
};



//-- Check for updates and be obnoxious about it
const obnoxiousNotificator = (pkg, sync = false) => {
	const boxen          = require('boxen');
	const updateNotifier = require('update-notifier');

	const message = (update = {}) => {
		return `Update available ${chalk.dim(update.current)} ${chalk.reset('→')} ${chalk.green(update.latest)}\nRun ${chalk.cyan('nwayo update')} to update`;
	};

	const options = {
		pkg: pkg,
		updateCheckInterval: 1
	};

	if (sync) {
		options.callback = (error, update) => {
			if (!error) {
				if (update.current !== update.latest) {
					echo(boxen(message(update), {
						padding:     1,
						margin:      1,
						align:       'center',
						borderColor: 'yellow',
						borderStyle: 'round'
					}));
				}
			} else {
				exit(error);
			}
		};
	}

	const notifier = updateNotifier(options);

	if (!sync) {
		notifier.notify({ message:message(notifier.update) });
	}
};

//-- Check for updates
const checkUpdate = (pkg, callback) => {
	const updateNotifier = require('update-notifier');
	updateNotifier({ pkg:pkg, updateCheckInterval:1, callback:callback });
};



//-- Boot in legacy mode
const bootLegacyMode = ({ root }) => {
	echo(chalk.yellow(`\n [Legacy mode]\n\n`));
	require('./legacy')({ root });
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

	//-- Trap `outdated`
	} else if (cmd('outdated')) {
		obnoxiousNotificator(cliPkg, true);

	//-- Trap `update`
	} else if (cmd('update')) {
		checkUpdate(cliPkg, (error, update) => {
			if (!error) {
				const terminal = require('@absolunet/terminal');

				terminal.spacer();

				if (update.current !== update.latest) {
					echo(`Update available: ${chalk.dim(update.current)} ${chalk.reset('→')} ${chalk.green(update.latest)}\n\nUpdating...`);
				} else {
					echo('No update available\n\nReinstalling...');
				}

				terminal.spacer();
				terminal.run('npm uninstall -g @absolunet/nwayo-cli && npm install -g @absolunet/nwayo-cli');

			} else {
				exit(error);
			}
		});

	} else {

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

			terminal.run(`cd ${root} && npm install --no-audit`);
		};

		const npmCI = () => {
			const terminal = require('@absolunet/terminal');
			try {
				terminal.run(`cd ${root} && npm ci`);
			} catch (e) {
				terminal.errorBox(`
					The package-lock.json file is outdated
					Please run ${chalk.underline('nwayo install workflow --force')} to update it
				`);
			}
		};

		const installWorkflow = cmd('install workflow', 'force');
		if (installWorkflow) {
			if (installWorkflow === true) {
				npmCI();
				exit();
			} else if (installWorkflow.flag === true) {
				npmInstall();
				exit();
			}
		}


		//-- Are dependencies installed ?
		if (fs.existsSync(nodeModules)) {

			//-- If uses workflow as a package
			if (projetPkg.dependencies && projetPkg.dependencies[WORKFLOW] || projetPkg.dependencies && projetPkg.dependencies[WORKFLOWFORK] ) {

				let workflow = '';
				if(projetPkg.dependencies[WORKFLOW]) {
					workflow = `${nodeModules}/${WORKFLOW}`;
				} else if(projetPkg.dependencies[WORKFLOWFORK]) {
					workflow = `${nodeModules}/${WORKFLOWFORK}`;
				}

				// If workflow package is present
				if (fs.existsSync(workflow)) {

					//-- Trap `--completion-logic`
					const completion = flag('completion-logic');
					if (completion) {

						const completionLogic = `${workflow}/completion`;
						if (fs.existsSync(completionLogic)) {
							echo(require(completionLogic)({ completion, root }));
						} else {
							echo(require(`./legacy/completion`)({ completion, root }));
						}
						exit();
					}

					//-- Let's do this
					obnoxiousNotificator(cliPkg);


					//-- Trap `nwayo install vendors` (for nwayo-workflow < 3.5.0)
					if (cmd('install vendors') === true) {
						if (!fs.existsSync(`${workflow}/cli/install.js`)) {
							bootLegacyMode({ root });
							exit();
						}
					}


					//-- Load workflow
					require(`${workflow}/cli`)({

						// nwayo-workflow < 3.5.0
						cwd:    root,
						infos:  {
							version: cliPkg.version,
							path:    __dirname
						},

						// nwayo-workflow >= 3.5.0
						cliPkg:  cliPkg,
						cliPath: __dirname

					});

				// Duuuuude.... Install the workflow
				} else {
					workflowNotInstalled();
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
				bootLegacyMode({ root });
			}

		// Duuuuude.... Install the workflow
		} else {
			workflowNotInstalled();
		}
	}
};

/* eslint-enable global-require */
