//-------------------------------------
//-- CLI
//-------------------------------------
'use strict';

module.exports = () => {
	process.title = 'nwayo';

	const cli = require(`${__dirname}/tasks`); // eslint-disable-line global-require

	cli.argv(process.argv.slice(2), process.cwd());
};
