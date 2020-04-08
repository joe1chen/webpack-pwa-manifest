const runTest = require('./runTest')
const tests = [
    'basic', 
    'complex', 
    'fingerprints-false',
    'issue-84',
    'issue-87', 
    'rgb-background', 
    'rgba-background',
    'preserve-aspect-ratio'
]

console.log('Running tests...')
runTest(tests.shift(), tests)
