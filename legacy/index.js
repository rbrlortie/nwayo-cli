//-------------------------------------
//-- CLI
//-------------------------------------
'use strict';

module.exports = () => {
	process.title = 'nwayo';

	require('coffee-script/register'); // eslint-disable-line global-require

	const minimist = require('minimist'); // eslint-disable-line no-unused-vars, global-require
	const cli      = require(`${__dirname}/tasks`); // eslint-disable-line global-require

	cli.argv(process.argv.slice(2), process.cwd());
};
