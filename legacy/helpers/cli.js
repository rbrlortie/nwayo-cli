//-------------------------------------
//-- CLI helpers
//-------------------------------------
'use strict';

const chalk  = require('chalk');
const spawn  = require('cross-spawn');
const fs     = require('fs');
const path   = require('path');
const semver = require('semver');

//-- PUBLIC
module.exports = {
	pkg: require(`${__dirname}/../../package`),  // eslint-disable-line global-require


	//-- Echo
	echo: console.log,  // eslint-disable-line no-console


	//-- Error
	error: function(msg) {
		if (msg) {
			this.echo(chalk.red(`\n ${msg}`));
		}

		return process ? process.exit(1) : undefined;  // eslint-disable-line no-process-exit
	},


	//-- Usage
	usage: function() {
		return this.echo(`
 Usage: ${chalk.yellow('nwayo')} ${chalk.cyan('<command>')}

 ${chalk.underline('Project commands')}
 ${chalk.yellow('nwayo run')} [${chalk.cyan('<task>')} [${chalk.cyan('<bundle>')}]]       Run a task
 ${chalk.yellow('nwayo rebuild')} [${chalk.cyan('<bundle>')}]            Run rebuild task
 ${chalk.yellow('nwayo watch')} [${chalk.cyan('<bundle>')}]              Run watch task
 ${chalk.yellow('nwayo install')} [${chalk.cyan('<scope>')}] [${chalk.yellow('--force')}]   Install dependencies ex:[workflow|vendors]
 ${chalk.yellow('nwayo doctor')}                        Diagnose project dependencies

 ${chalk.underline('CLI commands')}
 ${chalk.yellow('nwayo update')}             Update the CLI
 ${chalk.yellow('nwayo outdated')}           Check if CLI is outdated
 ${chalk.yellow('nwayo --version')}          Get CLI version
 ${chalk.yellow('nwayo --tasks')}            Get CLI tasks list
 ${chalk.yellow('nwayo --projecttasks')}     Get project tasks list
 ${chalk.yellow('nwayo --projectbundles')}   Get project bundles list
 ${chalk.yellow('nwayo --completion')}       Bash completion code
 ${chalk.yellow('nwayo --pronounce')}        How to pronounce

 Legacy mode
 nwayo@${this.pkg.version} ${path.normalize(`${__dirname}/../`)}
		`);
	},



	//-- Run
	run: function(task, context) {
		const tool = semver.lt(context.pkg.nwayo.version, '2.2.0') ? 'grunt' : 'gulp';
		const base = `${context.cwd}/node_modules/${tool}`;

		if (fs.existsSync(`${base}/package.json`)) {
			const arg = [task];

			const gruntCli = `${__dirname}/../../node_modules/grunt-cli`;
			let pkg;
			let bin = '';

			switch (tool) {

				case 'gulp':
					pkg = require(`${base}/package`);  // eslint-disable-line global-require
					bin = `${base}/${pkg.bin.gulp}`;
					arg.push('--cwd', context.cwd);
					break;

				case 'grunt':
					pkg = require(`${gruntCli}/package`);  // eslint-disable-line global-require

					bin = `${gruntCli}/${pkg.bin.grunt}`;
					arg.push('--gruntfile', `${context.cwd}/gruntfile.js`);
					break;

				default: break;

			}

			if (context.flags) {
				context.flags.forEach((value, flag) => {
					arg.push(`--${flag}`, value);
				});
			}

			const cmd = spawn(`${bin}`, arg, {
				env:   process.env, // eslint-disable-line no-process-env
				stdio: 'inherit'
			});

			return cmd.on('close', (code) => {
				return code && code !== 65 ? this.echo(code) : undefined;
			});

		}

		// Shouldn't be used anymore
		return this.error('Build tool not found. Please run `npm install`');

	}
};
