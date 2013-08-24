#!/usr/bin/env node

var fs = require('fs'),
    program = require('commander'),
    cheerio = require('cheerio'),
    rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKFILE_DEFAULT = "check.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var loadSiteFromUrl = function(url, callback) {
    rest.get(url)
	.on('complete', function(result) {
	if(result instanceof Error) {
	    callback(result);
	} else {
	    callback(null, result);
	}
    });
};

var loadHtmlFile = function(filePath) {
    return fs.readFileSync(filePath);
};

var cheerioHtmlContent = function(htmlContent) {
    return cheerio.load(htmlContent);
};

var loadChecks = function(checksFile) {
    return JSON.parse(fs.readFileSync(checksFile));
};

var checkHtmlFile = function(htmlContent, checksFile) {
    var $ = cheerioHtmlContent(htmlContent);
    var checks = loadChecks(checksFile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json',
		clone(assertFileExists), CHECKFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html',
		clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <site_url>', 'Url to www site')
	.parse(process.argv);
    if(program.url) {
	//get data from url
	loadSiteFromUrl(program.url, function(error, data) {
	    if(error) {
		throw error;
	    } else {
		var checkJson = checkHtmlFile(data, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
	    }
	});
    } else {
	//get data from file
	var fileData = loadHtmlFile(program.file);
	var checkJson = checkHtmlFile(fileData, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
