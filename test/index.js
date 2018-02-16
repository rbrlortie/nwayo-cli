//--------------------------------------------------------
//-- Tests
//--------------------------------------------------------
'use strict';

const tester = require('@absolunet/tester');

tester.lintJs([...tester.ALL_JS, 'legacy/**/*.js', 'bin/nwayo']);
