module.exports = Evergreen;

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
function Evergreen(runner) {

  var self = this;
  var stats = this.stats = {
    tests: 0,
    passes: 0,
    failures: 0,
    pending: 0
  };

  var tests = [];

  this.runner = runner;
  runner.stats = stats;
  /*
   * Runs on the start of all of the tests
   */
  runner.on('start', function() {
    stats.start = new Date();
  });

  /**
   * Runs after every test ends
   */
  runner.on('test end', function(test) {
    tests.push(test);
    stats.tests++;
  });

  runner.on('pass', function(test) {
    console.log(test.fullTitle() + ": Passed!");
    stats.passes++;
  });

  runner.on('fail', function(test) {
    console.log(test.fullTitle() + ": Failed :(\n");
    stats.failures++;
  });

  runner.on('pending', function(test) {
    console.log(test.fullTitle() + ": Pending\n");
    stats.pending++;
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
    console.log("Passed: %s", stats.passed);
    console.log("Failed: %s", stats.failed);
    console.log("Pending: %s", stats.pending);
    fs.writeFile('reporter.out', output, function(err){
      if (err) {
        process.exit(err);
      }
      process.exit(failed);
    });
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
    duration: test.duration,
    err: errorJSON(test.err || {})
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

exports = module.exports = EvergreenReporter;
