module.exports = (grunt) ->
	_          = require 'lodash'
	async      = require 'async'
	preprocess = require 'preprocess'

	config = grunt.config.get 'internal.config'
	pkg    = grunt.config.get 'internal.pkg'
	path   = grunt.config.get 'internal.path'
	util   = grunt.config.get 'util'

	skeleton         = path.skeleton.base
	foundation       = path.skeleton.foundation
	foundationdrupal = path.skeleton.foundation_drupal




	# build
	grunt.task.registerTask 'build', '', () ->
		done = this.async()

		less = []

		flags   = grunt.config.get('internal.flags')
		data    = _.merge {}, (if config[flags.cms] then config[flags.cms] else config.default), flags
		data.id = "#{data.name}_#{grunt.template.today('yyyymmddHHMMss')}"
		out     = "#{path.out.dist}/#{data.id}"

		data.root     += if data.theme then "/#{pkg.name}" else ''
		data.build     = "#{data.root}/builds"
		data.package   = pkg.name
		data.version   = pkg.version
		data.author    = pkg.author.name
		data.copyright = "\n\t<!-- #{pkg.name} #{pkg.version} (c) #{grunt.template.today('yyyy')} #{pkg.author.name} -->"

		data.ga      = if data.ga      then data.ga      else '{TODO}'
		data.addthis = if data.addthis then data.addthis else '{TODO}'
		data.domain  = if data.domain  then data.domain  else '{TODO}'

		data.less = ''


		# copy base
		if data.layout is 'foundation'
			if data.cms is 'drupal'
				src = path.skeleton.foundation_drupal
			else
				src = path.skeleton.foundation
		else
			src = path.skeleton.base

		util.copy "#{src}/", "#{out}/", ['**', '**/.gitignore']





		# theme
		if data.theme
			grunt.file.delete "#{out}/sources/css/libs/reset.css",
			grunt.file.delete "#{out}/sources/css/libs/normalize.css",
			grunt.file.delete "#{out}/sources/css/libs/html5boilerplate.css",
			grunt.file.delete "#{out}/sources/css/libs/nwayo-boilerplate.less"
		else
			less.push 'nwayo-boilerplate'


		# foundation
		if data.layout is 'foundation'
			grunt.file.delete "#{out}/sources/css/libs/reset.css",
			grunt.file.delete "#{out}/sources/css/libs/html5boilerplate.css",
			grunt.file.delete "#{out}/sources/css/libs/nwayo-boilerplate.less"


		# drupal
		if data.cms is 'drupal'
			less.push 'cms-drupal'

			if data.layout is 'foundation'
				less.push 'cms-drupal-zurbfoundation'
				grunt.file.copy "#{out}/STARTER.info", "#{out}/#{data.name}.info"
				grunt.file.delete "#{out}/STARTER.info"

			else
				grunt.file.delete "#{out}/sources/css/libs/cms-drupal-zurbfoundation.less"

		else
			grunt.file.delete "#{out}/sources/css/libs/cms-drupal.less"
			grunt.file.delete "#{out}/sources/css/libs/cms-drupal-zurbfoundation.less"


		# magento
		if data.cms is 'magento'
			less.push 'cms-magento'
		else
			grunt.file.delete "#{out}/sources/css/libs/cms-magento.less"


		# sitecore
		if data.cms is 'sitecore'
			less.push 'cms-sitecore'
		else
			grunt.file.delete "#{out}/sources/css/libs/cms-sitecore.less"


		# no cms
		if data.cms is ''
			grunt.file.delete "#{out}/sources/css/misc/editor.less"



		# build less loader
		data.less += "@import 'libs/#{file}';\n" for file in less




		# process data var
		data[key] = preprocess.preprocess value, data if grunt.util.kindOf(value) is 'string' for key, value of data

		# process files
		files = grunt.file.expand { cwd:"#{out}/", filter:'isFile'}, ['**','!__DRUPAL-THEME__zurb-foundation/**']
		bar = util.progress 'Processing', files.length

		async.mapLimit files, 10,
			(item, callback) -> 
				preprocess.preprocessFile "#{out}/#{item}", "#{out}/#{item}", data, ()-> callback(null, item); bar.tick()
			
			(error, results) -> 
				util.progress_done bar
				grunt.log.ok "\nYour #{pkg.name} flavour #{data.id.cyan} is ready for your taster!"
				done()



