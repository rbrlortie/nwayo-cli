#-------------------------------------
#-- CLI helpers
#-------------------------------------
'use strict'


#-- PUBLIC
module.exports =
	pkg:        require '../../package'
	configfile: '.nwayokonfig'


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
			chalk.yellow('nwayo analyze') + ' [' + chalk.cyan('<name>') + ']    analyze project dependencies'
			chalk.yellow('nwayo get') + ' [' + chalk.cyan('<component>') + ']   install a nwayo component'
			chalk.yellow('nwayo run') + ' [' + chalk.cyan('<task>') + ']        run a task'
			chalk.yellow('nwayo watch') + '               run watch task'
			''
			chalk.underline 'Global commands'
			chalk.yellow('nwayo version') + '             get cli version'
			chalk.yellow('nwayo grow') + '                grow a new project'
			''
			"nwayo@#{@pkg.version} #{path.dirname __dirname}"
			''
		].join '\n '



	#-- Run
	run: (task, context) ->
		fs   = require 'fs'
		base = "#{context.cwd}/node_modules/gulp"

		if fs.existsSync "#{base}/package.json"
			pkg   = require "#{base}/package"
			spawn = require('child_process').spawn

			cmd = spawn "#{base}/#{pkg.bin.gulp}", [task], { env:process.env, stdio:'inherit' }
			cmd.on 'close', (code) ->
				if code and code is not 65
					@echo code

		else @error 'Build tool not found. Please run \'npm install\''