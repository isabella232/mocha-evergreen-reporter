exports = module.exports = EvergreenReporter;

/**
 * Module dependencies.
 */
var mocha = require('mocha');
var fs = require('fs');
var mkdirp = require('mkdirp');
var format = require('util').format;
var path = require('path');
var debug = require('debug')('evergreen-mocha-reporter');

/**
 * Initialize a new `Evergreen` reporter.
 *
 * @api public
 * @param {Runner} runner
 */
function EvergreenReporter(runner) {
  mocha.reporters.Base.call(this, runner);

  var logDir = 'test_logs';
  var self = this;
  var indents = 0;
  var stats = (this.stats = {
    tests: 0,
    passes: 0,
    failures: 0,
    pending: 0
  });

  var tests = [];

  this.runner = runner;
  runner.stats = stats;

  debug('setting up handlers...');

  function indent() {
    return Array(indents).join('  ');
  }

  /*
   * Runs on the start of all of the tests
   */
  runner.on('start', function() {
    stats.start = Date.now();
    debug('starting!');
  });

  runner.on('suite', function(suite) {
    debug('suite start %s', suite.title, suite.file);
    console.log(suite.title);
    if (suite.file) {
      console.log(suite.file);
    }
    indents++;
  });

  runner.on('suite end', function(suite) {
    debug('suite end %s', suite.title, suite.file);
    console.log();
    indents--;
  });

  /**
   * Runs before every test begins
   */
  runner.on('test', function(test) {
    debug('test', test.title);
    test.start = Date.now() / 1000;
  });

  /**
   * Runs after every test ends
   */
  runner.on('test end', function(test) {
    stats.tests++;
    tests.push(test);
  });

  runner.on('pass', function(test) {
    console.log(indent() + test.title + ': Passed!');
    console.log();
    stats.passes++;
    test.exit_code = 0;
    test.state = 'pass';
    test.end = Date.now() / 1000;
  });

  runner.on('fail', function(test, err) {
    test.err = err;
    test.exit_code = 1;
    test.state = 'fail';
    test.end = Date.now() / 1000;
    console.log(indent() + test.title + ': Failed :(');
    console.log(test.err.message);
    console.log(test.err.stack);
    console.log();
    stats.failures++;
  });

  runner.on('pending', function(test) {
    console.log(indent() + test.title + ': Skip');
    console.log();
    stats.pending++;
    test.state = 'skip';
    test.duration = 0;
    test.exit_code = 0;
    test.start = Date.now() / 1000;
    test.end = test.start;
  });

  /**
   * Runs after all tests have completed
   */
  runner.on('end', function() {
    debug('end!', arguments);
    stats.end = Date.now() / 1000;
    stats.duration = stats.end - stats.start;

    var obj = {
      end: stats.end,
      start: stats.start,
      elapsed: stats.duration,
      failures: stats.failures,
      results: tests.map(report)
    };

    runner.testResults = obj;
    debug('test results', runner.testResults);

    var output = JSON.stringify(obj, null, 2);

    var reportPath = path.join(process.cwd(), 'report.json');
    fs.writeFileSync(reportPath, output);
    debug('report json written to', reportPath);

    console.log('-----------------------------------');
    console.log('# mocha-evergreen-reporter: Results');
    console.log('Passed: %s', stats.passes);
    console.log('Failed: %s', stats.failures);
    console.log('Skipped: %s', stats.pending);
    console.log('Report Path: %s', reportPath);
    console.log('-----------------------------------');

    process.exit(stats.failures);
  });
}

/**
 * Return an object with all of the relevant information for the test.
 *
 * @api private
 * @param {Object} test
 * @return {Object}
 */
function report(test) {
  return {
    test_file: test.file + ': ' + test.fullTitle(),
    start: test.start,
    end: test.end,
    exit_code: test.exit_code,
    elapsed: test.duration / 1000,
    error: errorJSON(test.err || {}),
    url: test.url,
    status: test.state
  };
}

/**
 * Writes logs to a file in the specified directory
 * @param {test} test
 * @param {string} dirName
 */
function writeLogs(test, dirName) {
  var logs =
    test.fullTitle() +
    '\n' +
    test.file +
    '\nStart: ' +
    test.start +
    '\nEnd: ' +
    test.end +
    '\nElapsed: ' +
    test.duration +
    '\nStatus: ' +
    test.state;
  if (test.state === 'fail') {
    logs += '\nError: ' + test.err.stack;
  }
  mkdirp.sync(testDir(test, dirName));
  fs.writeFileSync(testURL(test, dirName), logs);
  test.url = testURL(test, dirName);
}

/**
 * Creates the test url for a test
 * @param {test} test
 * @param {string} dirName
 * @return {string} testURL
 */
function testURL(test, dirName) {
  return format('%s/%s.log', testDir(test, dirName), test.fullTitle());
}

/**
 * Creates the directory that the test log is going to go in
 * @param {test} test
 * @param {string} dirName
 * @return {string} testDir
 */
function testDir(test, dirName) {
  if (test.file) {
    var testFile = test.file.split('/').pop();
    testFile = testFile.split('.')[0];
    return format('%s/%s', dirName, testFile);
  } else {
    return dirName;
  }
}

/**
 * Transform `error` into a JSON object.
 *
 * @api private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
  var res = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    res[key] = err[key];
  }, err);
  return res;
}
