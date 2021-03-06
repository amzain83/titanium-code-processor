/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/TiIncludeFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	CodeProcessorUtils = require(path.join(global.titaniumCodeProcessorLibDir, 'CodeProcessorUtils')),

	pluralize = CodeProcessorUtils.pluralize,

	results,
	renderData;

// ******** Helper Methods ********

function generateResultsData() {
	var resolved = results.resolved.length,
		unresolved = results.unresolved.length,
		missing = results.missing.length,
		summary = [];
	if (resolved) {
		summary.push(pluralize('%s file', '%s files', resolved) + ' resolved');
	}
	if (unresolved) {
		summary.push(pluralize('%s file', '%s files', unresolved) + ' not resolved');
	}
	if (missing) {
		summary.push(pluralize('%s file', '%s files', missing) + ' missing');
	}
	if (summary.length) {
		if (summary.length > 1) {
			summary[summary.length - 1] = 'and ' + summary[summary.length - 1];
		}
		results.summary = summary.join(', ');
	} else {
		results.summary = 'No files included';
	}
}

function generateRenderData() {
	var numIncludesResolved = results.resolved.length,
		numIncludesUnresolved = results.unresolved.length,
		numIncludesMissing = results.missing.length,
		resolved,
		unresolved,
		missing,
		baseDirectory = path.dirname(Runtime.getEntryPointFile()) + path.sep;

	if (numIncludesResolved) {
		resolved = {
			list: []
		};
		results.resolved.forEach(function (file) {
			resolved.list.push({
				name: file.data.name,
				path: file.data.path.replace(baseDirectory, ''),
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	if (numIncludesUnresolved) {
		unresolved = {
			list: []
		};
		results.unresolved.forEach(function (file) {
			unresolved.list.push({
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	if (numIncludesMissing) {
		missing = {
			list: []
		};
		results.missing.forEach(function (file) {
			missing.list.push({
				name: file.data.name,
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	renderData = {
		pluginDisplayName: this.displayName,
		numIncludesResolved: pluralize('%s file', '%s files', numIncludesResolved),
		numIncludesUnresolved: pluralize('%s file', '%s files', numIncludesUnresolved),
		numIncludesMissing: pluralize('%s file', '%s files', numIncludesMissing),
		resolved: resolved,
		unresolved: unresolved,
		missing: missing
	};
}

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 *
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 *
 * @constructor
 * @name module:plugins/TiIncludeFinder
 */
module.exports = function () {
	results = {
		resolved: [],
		unresolved: [],
		missing: []
	};
	Runtime.on('tiIncludeResolved', function(e) {
		results.resolved.push(e);
	});
	Runtime.on('tiIncludeUnresolved', function(e) {
		results.unresolved.push(e);
	});
	Runtime.on('tiIncludeMissing', function(e) {
		results.missing.push(e);
	});
	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
	});
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiIncludeFinder#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/TiIncludeFinder#getResults
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method
 * @param {String} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {Object} The information for generating the template(s). Each template is defined as a key-value pair in the
 *		object, with the key being the name of the file, without a path. Two keys are expected: template is the path to
 *		the mustache template (note the name of the file must be unique, irrespective of path) and data is the
 *		information to dump into the template
 */
module.exports.prototype.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiIncludeFinderTemplate.html'),
		data: renderData
	};

	return template;
};

/**
 * Renders the results data to a log-friendly string
 *
 * @param {Function} arrayGen Log-friendly table generator
 * @return {String} The rendered data
 */
module.exports.prototype.renderLogOutput = function (arrayGen) {
	var resultsToLog = renderData.numIncludesResolved + ' resolved\n' +
		renderData.numIncludesUnresolved + ' unresolved\n' +
		renderData.numIncludesMissing + ' missing';
	if (renderData.resolved) {
		resultsToLog += '\n\nResolved Files\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name', 'Resolved Path'], renderData.resolved.list, ['filename', 'line', 'name', 'path']);
	}
	if (renderData.unresolved) {
		resultsToLog += '\n\nUnresolved Files\n';
		resultsToLog += arrayGen(['File', 'Line'], renderData.unresolved.list, ['filename', 'line']);
	}
	if (renderData.missing) {
		resultsToLog += '\n\nMissing Files\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name'], renderData.missing.list, ['filename', 'line', 'name']);
	}
	return resultsToLog;
};
