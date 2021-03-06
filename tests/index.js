const runTest = require('./runTest')
const tests = [
    'basic', 
    'complex', 
    'fingerprints-false',
    'fingerprints-manifest',
    'fingerprints-icons',
    'issue-84',
    'issue-87', 
    'rgb-background', 
    'rgba-background',
    'preserve-aspect-ratio',
    'preserve-filename'
]

console.log('Running tests...')
runTest(tests.shift(), tests)
