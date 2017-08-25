#-------------------------------------
#-- CLI helpers
#-------------------------------------
'use strict'


#-- PUBLIC
module.exports =
	pkg: require "#{__dirname}/../../package"


	#-- Echo
	echo: console.log


	#-- Error
	error: (msg) ->
		chalk = require 'chalk'

		@echo chalk.red "\n #{msg}" if msg
		process.exit(1) if process



	#-- Usage
	usage: ->
		chalk = require 'chalk'
		path  = require 'path'

		@echo [
			'\n'
			'Usage: ' + chalk.yellow 'nwayo' + chalk.cyan ' <command>'
			''
			chalk.underline 'Project commands'
			chalk.yellow('nwayo get') + ' [' + chalk.cyan('<component>') + ']         Install a nwayo component'
			chalk.yellow('nwayo run') + ' [' + chalk.cyan('<task>') + ' [' + chalk.cyan('<bundle>') + ']]   Run a task'
			chalk.yellow('nwayo rebuild') + ' [' + chalk.cyan('<bundle>') + ']        Run rebuild task'
			chalk.yellow('nwayo watch') + ' [' + chalk.cyan('<bundle>') + ']          Run watch task'
			chalk.yellow('nwayo doctor') + '                    Diagnose project dependencies'
			''
			chalk.underline 'Global commands'
			chalk.yellow('nwayo grow') + '   Grow a new project'
			''
			chalk.underline 'Flag commands'
			chalk.yellow('nwayo --version') + '        Get cli version'
			chalk.yellow('nwayo --tasks') + '          Get cli tasks list'
			chalk.yellow('nwayo --projecttasks') + '   Get project tasks list'
			chalk.yellow('nwayo --projectbundles') + ' Get project bundles list'
			chalk.yellow('nwayo --completion') + '     Bash completion code'
			chalk.yellow('nwayo --pronounce') + '      How to pronounce'
			''
			"nwayo@#{@pkg.version} #{path.normalize "#{__dirname}/../"}"
			''
		].join '\n '



	#-- Run
	run: (task, context) ->
		fs     = require 'fs'
		semver = require 'semver'

		tool = if semver.lt context.prjnwayoversion, '2.2.0' then 'grunt' else 'gulp'
		base = if semver.gte context.prjnwayoversion, '3.2.0' then "#{context.cwd}/node_modules/@absolunet/nwayo-workflow/node_modules/#{tool}" else "#{context.cwd}/node_modules/#{tool}"

		if fs.existsSync "#{base}/package.json"
			bin = ''
			arg = [task]

			switch tool

				when 'gulp'
					pkg = require "#{base}/package"
					bin = "#{base}/#{pkg.bin.gulp}"

					arg.push '--cwd', context.cwd

					if semver.gte context.prjnwayoversion, '3.3.0'
						arg.push '--gulpfile', "#{context.cwd}/node_modules/@absolunet/nwayo-workflow/workflow/gulpfile.js"

					else if semver.gte context.prjnwayoversion, '3.2.0'
						arg.push '--gulpfile', "#{context.cwd}/node_modules/@absolunet/nwayo-workflow/gulpfile.js"

				when 'grunt'
					grunt_cli = "#{__dirname}/../../node_modules/grunt-cli"
					pkg = require "#{grunt_cli}/package"

					bin = "#{grunt_cli}/#{pkg.bin.grunt}"
					arg.push '--base', context.cwd
					arg.push '--gruntfile', "#{context.cwd}/gruntfile.js"


			arg.push "--#{flag}", value for flag, value of context.flags if context.flags

			spawn = require('win-spawn')
			cmd = spawn "#{bin}", arg, { env:process.env, stdio:'inherit' }
			cmd.on 'close', (code) ->
				if code and code is not 65
					@echo code




		else @error 'Build tool not found. Please run `npm install`'