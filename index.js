exports = module.exports = EvergreenReporter;

/**
 * Module dependencies.
 */
var Mocha = require('mocha');
var fs = require('fs');



/**
 * Initialize a new `Evergreen` reporter.
 *
 * @api public
 * @param {Runner} runner
 */
function EvergreenReporter(runner) {

  var self = this;
  var indents = 0;
  var stats = this.stats = {
    tests: 0,
    passes: 0,
    failures: 0,
    pending: 0
  };

  var tests = [];

  this.runner = runner;
  runner.stats = stats;

  function indent() {
    return Array(indents).join('  ');
  }

  /*
   * Runs on the start of all of the tests
   */
  runner.on('start', function() {
    stats.start = Date.now();
  });

  runner.on('suite', function(suite) {
    console.log(suite.title);
    console.log(suite.file);
    indents++;
  });

  runner.on('suite end', function() {
    console.log();
    indents--;
  });

  /**
   * Runs before every test begins
   */
  runner.on('test', function(test) {
    test.start = Date.now();
  });

  /**
   * Runs after every test ends
   */
  runner.on('test end', function(test) {
    stats.tests++;
    test.end = Date.now();
    tests.push(test);
  });

  runner.on('pass', function(test) {
    console.log(indent() + test.title + ": Passed!");
    console.log();
    stats.passes++;
    test.exit_code = 0;
    test.state = 'pass';
  });

  runner.on('fail', function(test, err) {
    test.err = err;
    test.exit_code = 1;
    test.state = 'fail';
    console.log(indent() + test.title + ": Failed :(");
    console.log(test.err.message);
    console.log(test.err.stack);
    console.log();
    stats.failures++;
  });

  runner.on('pending', function(test) {
    console.log(indent() + test.title + ": Pending");
    console.log();
    stats.pending++;
    test.state = 'pending';
    test.elapsed = 0;
    test.start = Date.now();
  });

  /**
   * Runs after all tests have completed
   */
  runner.on('end', function() {
    stats.end = Date.now();
    stats.duration = stats.end - stats.start;

    var obj = {
      end: stats.end,
      start: stats.start,
      elapsed: stats.duration,
      failures: stats.failures,
      results: tests.map(report),
    };

    runner.testResults = obj;
    var output = JSON.stringify(obj, null, 2);
    fs.writeFileSync('report.json', output);
    console.log("Passed: %s", stats.passes);
    console.log("Failed: %s", stats.failures);
    console.log("Pending: %s", stats.pending);
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
    title: test.title,
    fullTitle: test.fullTitle(),
    test_file: test.file,
    start: test.start,
    end: test.end,
    exit_code: test.exit_code,
    elapsed: test.duration,
    err: errorJSON(test.err || {}),
    status: test.state
  };
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

