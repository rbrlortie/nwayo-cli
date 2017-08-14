#-------------------------------------
#-- CLI
#-------------------------------------
'use strict'
helper = require '../helpers/cli'


#-- PUBLIC
module.exports =

	#-- Arguments value
	argv: (argv, cwd) ->
		path   = require 'path'
		fs     = require 'fs'
		findUp = require 'find-up'
		yaml   = require 'js-yaml'

		# make echos trappable in tests
		helper.echo = console.log
		# --

		context =
			command: argv[0] or ''
			target:  argv[1] or ''
			targets: argv.slice 1

		isFlag = context.command.substring(0,2) is '--'

		# run command
		if context.command isnt 'index' and ( isFlag or fs.existsSync "#{__dirname}/#{context.command}.coffee" )

			# if project command
			if ['doctor','get','rebuild','run','watch', '--projecttasks', '--projectbundles'].indexOf(context.command) isnt -1

				configFilepath = findUp.sync 'nwayo.yaml', { cwd: cwd }

				if configFilepath isnt null
					config = yaml.safeLoad fs.readFileSync(configFilepath, 'utf8');
					context.cwd = fs.realpathSync path.dirname(configFilepath) + '/' + config.root

					# get project package.json file
					if fs.existsSync "#{context.cwd}/package.json"
						context.pkg = require "#{context.cwd}/package"

						# check for nwayo config info
						oldconfig = !!context.pkg.nwayo
						newconfig = context.pkg.dependencies && context.pkg.dependencies['@absolunet/nwayo-workflow']

						if oldconfig and newconfig then helper.error 'Please remove \'nwayo\' config in package.json'
						if not oldconfig and not newconfig then helper.error 'No nwayo config found'

						context.prjnwayoversion = if newconfig then context.pkg.dependencies['@absolunet/nwayo-workflow'] else context.pkg.nwayo.version

					else helper.error 'No package.json file found'

				else
					helper.error 'No nwayo.yaml file found'


			if isFlag

				if context.command is '--completion'
					data = fs.readFileSync "#{__dirname}/../../completion/bash", 'utf8'
					helper.echo data

				else if context.command is '--tasks'
					files = fs.readdirSync "#{__dirname}"
					tasks = []
					for file in files
						tasks.push file.substr(0, file.length-7) if file isnt 'index.coffee' and file.substring(0,5) isnt 'flag-'

					helper.echo tasks.join '\n'

				else if context.command is '--projecttasks'
					helper.run '--tasks-simple', context

				else if context.command is '--projectbundles'
					dirs = fs.readdirSync "#{context.cwd}/bundles/"
					helper.echo dirs.join '\n'

				else if context.command is '--version' or context.command is '--pronounce'
					require("../cli/flag-#{context.command.substr(2)}").run context

				else
					helper.usage()


			else
				require("../cli/#{context.command}").run context


		else
			helper.usage()
