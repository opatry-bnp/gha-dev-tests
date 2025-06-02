const core = require('@actions/core');
const github = require('@actions/github');

console.log('\n');
console.log('################################################');
console.log('#                                              #');
console.log('#     WELCOME TO AUTO-ASSIGN GITHUB ACTION     #');
console.log('#                                              #');
console.log('################################################');
console.log('\n');

const myToken = core.getInput('myToken');
const octokit = github.getOctokit(myToken);
const context = github.context;
const repo = context.repo;
const pullRequest = context.payload.pull_request;
const maxPrPerUser = 3;

run();

async function run() {
  console.log('HERE I AM', repo, pullRequest)
}
