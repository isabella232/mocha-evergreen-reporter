# mocha-evergreen-reporter [![Linux CI][travis_img]][travis_url] [![][npm_img]][npm_url]

> A [mocha reporter](https://github.com/mochajs/mocha/wiki/Third-party-reporters) for [MongoDB Evergreen](https://github.com/evergreen-ci/evergreen/).

## Install

```bash
npm install --save-dev mocha-evergreen-reporter
```

## Usage

Use mocha's `--reporter` CLI option:

```
npm test -- --reporter=mocha-evergreen-reporter
```

## Example

For `mocha-evergreen-reporter`, there is a single test suite:

```javascript
describe('mocha-evergreen-reporter', function() {
  it.skip('has tests');
  it('should pass', function() {
      // TODO :D
  });
});
```

Running `npm test` produces:

```
☉ [master] mocha-evergreen-reporter/ npm test

> mocha-evergreen-reporter@0.0.6 test /data/mci/6e4a525e8a3bc3c1613144eae5b704df/src
> mocha --reporter=./index.js


mocha-evergreen-reporter
/data/mci/6e4a525e8a3bc3c1613144eae5b704df/src/test/index.test.js
  has tests: Skip

  should pass: Passed!



-----------------------------------
# mocha-evergreen-reporter: Results
Passed: 1
Failed: 0
Skipped: 1
Report Path: /data/mci/6e4a525e8a3bc3c1613144eae5b704df/src/report.json
-----------------------------------
```

Modify your `.evergreen.yml` to attach the test results for your task:

```yaml
- command: attach.results
    params:
    file_location: src/report.json
```

The contents of the generated `report.json`:

```json
{
  "end": 1541798478.687,
  "start": 1541798478678,
  "elapsed": -1540256680199.313,
  "failures": 0,
  "results": [
    {
      "test_file": "/data/mci/6e4a525e8a3bc3c1613144eae5b704df/src/test/index.test.js: mocha-evergreen-reporter has tests",
      "start": 1541798478.681,
      "end": 1541798478.681,
      "exit_code": 0,
      "elapsed": 0,
      "error": {},
      "status": "skip"
    },
    {
      "test_file": "/data/mci/6e4a525e8a3bc3c1613144eae5b704df/src/test/index.test.js: mocha-evergreen-reporter should pass",
      "start": 1541798478.681,
      "end": 1541798478.683,
      "exit_code": 0,
      "elapsed": 0,
      "error": {},
      "status": "pass"
    }
  ]
}
```

## Debugging

Set the `DEBUG` environment variable to [enable debug message output](https://www.npmjs.com/package/debug):

```
DEBUG=mocha-evergreen-reporter
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/mocha-evergreen-reporter.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/mocha-evergreen-reporter
[npm_img]: https://img.shields.io/npm/v/mocha-evergreen-reporter.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mocha-evergreen-reporter
