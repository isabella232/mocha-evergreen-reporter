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
    stats.start = new Date();
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
   * Runs after every test ends
   */
  runner.on('test end', function(test) {
    stats.tests++;
  });

  runner.on('pass', function(test) {
    console.log(indent() + test.title + ": Passed!");
    console.log();
    stats.passes++;
    tests.push(test);
  });

  runner.on('fail', function(test, err) {
    test.err = err;
    console.log(indent() + test.title + ": Failed :(");
    console.log(test.err.message);
    console.log(test.err.stack);
    console.log();
    stats.failures++;
    tests.push(test);
  });

  runner.on('pending', function(test) {
    console.log(indent() + test.title + ": Pending");
    console.log();
    stats.pending++;
    tests.push(test);
  });

  /**
   * Runs after all tests have completed
   */
  runner.on('end', function() {
    stats.end = new Date();
    stats.durection = stats.end - stats.start;

    var obj = {
      end: stats.end.value,
      start: stats.start.value,
      elapsed: stats.duration,
      failures: stats.failures,
      results: tests.map(report),
    };

    runner.testResults = obj;
    var output = JSON.stringify(obj, null, 2);
    console.log(output);
    console.log("Passed: %s", stats.passes);
    console.log("Failed: %s", stats.failures);
    console.log("Pending: %s", stats.pending);
    fs.writeFileSync('reporter.json', output);
    if (err) {
      console.log(err);
      process.exit(err);
    }
    process.exit(failed);
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
    file: test.file,
    duration: test.duration,
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

