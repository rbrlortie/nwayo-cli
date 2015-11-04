#-------------------------------------
#-- CLI
#-------------------------------------
'use strict'
helper = require '../helpers/cli'


#-- PUBLIC
module.exports =

	#-- Arguments value
	argv: (argv, cwd) ->
		fs = require 'fs'

		# make echos trappable in tests
		helper.echo = console.log
		# --

		context =
			command: argv[0] or ''
			target:  argv[1] or ''
			targets: argv.slice 1
			cwd:     cwd or __dirname

		isDataFetching = context.command.substring(0,2) is '--'

		# run command
		if context.command isnt 'index' and ( isDataFetching or fs.existsSync "#{__dirname}/#{context.command}.coffee" )

			# if project command
			if ['doctor','get','rebuild','run','watch', '--tasks'].indexOf(context.command) isnt -1

				# get project package.json file
				if fs.existsSync "#{context.cwd}/package.json"
					context.pkg = require "#{context.cwd}/package"

					# check for nwayo config info
					if not context.pkg.nwayo then helper.error 'No nwayo config found'

				else helper.error 'No package.json file found'


			if isDataFetching

				if context.command is '--completion'
					data = fs.readFileSync "#{__dirname}/../../completion/bash", 'utf8'
					helper.echo data

				else if context.command is '--tasks'
					files = fs.readdirSync "#{__dirname}"
					tasks = []
					for file in files
						tasks.push file.substr(0, file.length-7) if file isnt 'index.coffee'

					helper.echo tasks.join '\n'

				else if context.command is '--projecttasks'
					helper.run '--tasks-simple', context

				else if context.command is '--projectbundles'
					files = fs.readdirSync "#{context.cwd}/bundles/"
					bundles = []
					for file in files
						bundles.push file.substr(0, file.length-5) if file.substr(-5, 5) is '.yaml'

					helper.echo bundles.join '\n'


			else
				require("../cli/#{context.command}").run context


		else
			helper.usage()
