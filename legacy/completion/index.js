//--------------------------------------------------------
//-- Completion
//--------------------------------------------------------
'use strict';

// We disable global require rule to optimize the speed of the CLI for unrelated workflow stuff
/* eslint-disable global-require */

const TASKS = [
	'assets', 'assets-fonts', 'assets-images-optimization', 'assets-images-highdensity', 'assets-raw', 'assets-images',
	'icons', 'icons-favicon', 'icons-share', 'icons-tile',
	'local', 'local-constants',
	'scripts', 'scripts-lint', 'scripts-constants', 'scripts-vendors', 'scripts-compile',
	'styles', 'styles-images', 'styles-lint', 'styles-constants', 'styles-compile',
	'rebuild', 'rebuild-ss',
	'watch'
];
const LEVEL1_FLAGS   = ['-h', '--help', '-v', '--version', '--pronounce'];


const flag = (items, flags) => {
	return items.pop().startsWith('-') ? flags : [];
};


const level1Cmds = () => {
	const fs = require('fs');

	const list = [];
	fs.readdirSync(`${__dirname}/../tasks`).forEach((cmdName) => {
		const [, cmd] = cmdName.match(/^([a-zA-Z0-9-]+).js$/) || [];

		if (cmd && cmd !== 'index' && cmd !== 'flag-pronounce') {
			list.push(cmd);
		}
	});

	return list;
};


const bundles = (root) => {
	const fs  = require('fs');
	const dir = `${root}/bundles`;

	const list = [];
	if (fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach((bundleName) => {
			const [, bundleDir]  = bundleName.match(/^([a-zA-Z0-9-]+)$/) || [];
			const [, bundleFile] = bundleName.match(/^([a-zA-Z0-9-]+).yaml$/) || [];

			if (bundleFile) {
				list.push(bundleFile);

			} else if (bundleDir) {
				list.push(bundleDir);

				fs.readdirSync(`${dir}/${bundleDir}`).forEach((subbundleName) => {
					const [, subbundle] = subbundleName.match(/^_([a-zA-Z0-9-]+)\.yaml$/) || [];

					if (subbundle) {
						list.push(`${bundleDir}:${subbundle}`);
					}
				});
			}
		});
	}

	return list;
};






module.exports = ({ completion, root }) => {
	const items = completion.split(' ');
	items.shift();

	let values = [];

	switch (items.length) {

		case 1:
			values = [].concat(level1Cmds(), flag(items, LEVEL1_FLAGS));
			break;

		case 2:
			switch (items[0]) {

				case 'run':
					values = TASKS;
					break;

				case 'rebuild':
					values = bundles(root);
					break;

				default: break;

			}
			break;

		case 3:
			switch (items[0]) {

				case 'run':
					values = bundles(root);
					break;

				default: break;

			}
			break;

		default: break;

	}

	return values.join(' ');
};

/* eslint-enable global-require */
