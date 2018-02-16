//-------------------------------------
//-- Pronounce
//-------------------------------------
'use strict';

const helper    = require('../helpers/cli');
const { spawn } = require('child_process');


//-- PUBLIC
module.exports = {

	//-- Run
	run: (/* context */) => {

		helper.echo('/nwajo/');

		return process.platform === 'darwin' ? spawn('say', ['nwaw', 'yo']) : undefined;
	}
};
