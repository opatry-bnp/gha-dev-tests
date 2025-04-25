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

const allReviewers = [
  ['amineharbaouibnp', 'DHB'],
  ['BastienExalt', 'DHB'],
  ['EduardoBritto222', 'PAI'],
  ['mohamed3bennis', 'PAI'],
  ['MartinJuhelBnp', 'PAI'],
  ['Sarrabourouissi', 'PAI'],
  ['AdrienDef', 'STE'],
  ['boubakertilouche50', 'STE'],
  ['koassivi', 'STE'],
  ['jacky-quach', 'TOK'],
  ['osdiarra', 'TOK'],
  ['AlexLeBouedec', 'TOK'],
  ['jeremybras', 'WER'],
  ['opatry-bnp', 'WER'],
  ['Remi-Balbous', 'WER'],
];

run();

async function run() {
  try {
    if (pullRequest.draft) {
      logNoReviewerAssigned('status at draft');
      return;
    }

    if (isReportPR()) {
      logNoReviewerAssigned('PR is a report branch');
      return;
    }

    if (pullRequest.requested_reviewers.length > 0) {
      logNoReviewerAssigned('reviewers already assigned');
      return;
    }

    const selectedReviewers = await selectReviewers();
    console.log(`Selected reviewers = ${selectedReviewers}`);

    await octokit.rest.pulls.requestReviewers({
      ...repo,
      pull_number: pullRequest.number,
      reviewers: selectedReviewers,
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function logNoReviewerAssigned(cause) {
  console.log(`No reviewers assigned to Pull Request ${pullRequest.title} (#${pullRequest.number}) due to ${cause}`);
}

function isReportPR() {
  return pullRequest.labels.some(label => label.name === 'REPORT');
}

async function selectReviewers() {
  const squadOfPR = squadOfPrOpener();
  const reviewersInSquad = allReviewers.filter(value =>
    value[0] !== pullRequest.user.login && value[1] === squadOfPR
  );
  const reviewersOutOfSquad = allReviewers.filter(value =>
    value[0] !== pullRequest.user.login && value[1] !== squadOfPR
  );

  console.log(`Reviewers in the Squad: ${reviewersInSquad}`);
  console.log(`Reviewers out of the Squad: ${reviewersOutOfSquad}`);

  const selectedReviewers = [];

  if (reviewersInSquad.length > 0) {
    const selectedReviewer = await randomlySelectReviewer(reviewersInSquad)
    selectedReviewers.push(selectedReviewer);
  } else {
    console.log('Nobody in the squad, selecting 2 reviewers out of the squad');
    const selectedReviewer = await randomlySelectReviewer(reviewersOutOfSquad)
    selectedReviewers.push(selectedReviewer);
    reviewersOutOfSquad = reviewersOutOfSquad.filter(value =>
      value[0] !== selectedReviewers[0]
    );
  }

  const selectedReviewer2 = await randomlySelectReviewer(reviewersOutOfSquad)
  selectedReviewers.push(selectedReviewer2);
  return selectedReviewers;
}

async function randomlySelectReviewer(reviewersList) {
  const selectedIndex = Math.floor(Math.random() * reviewersList.length);
  const candidate = reviewersList[selectedIndex][0];
  const isCandidateIdle = await isUserIdle(candidate);

  if (isCandidateIdle) {
    return candidate;
  } else if (reviewersList.length > 1) {
    reviewersList.splice(selectedIndex, 1);
    return await randomlySelectReviewer(reviewersList);
  } else {
    // TODO an improvement would be to compute the amount of PR where a user is involved and keep it
    //      then choose the one that has the minimum of PR where he's already involved. 
    return reviewersList[0][0];
  }
}

function squadOfPrOpener() {
  const developerInformation = allReviewers.find(value =>
    value[0] === pullRequest.user.login
  );
  const squad = developerInformation ? developerInformation[1] : null;
  console.log(`${pullRequest.user.login}'s squad is ${squad}`);
  return squad;
}

async function isUserIdle(user) {
  try {
    const userPrReviewRequestedCount = await numberOfPr(`review-requested:${user}`);
    const userPrAssignedCount = await numberOfPr(`assignee:${user}`);
    const userPrInvolvedCount = userPrReviewRequestedCount + userPrAssignedCount;

    console.log(`Number of PRs where ${user} is involved: ${userPrInvolvedCount}`);
    return userPrInvolvedCount <= maxPrPerUser;
  } catch (error) {
    console.error('Error while checking PR assignment:', error.message);
    return false;
  }
}

async function numberOfPr(criteria) {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
        // q: `type:pr is:open ${criteria} repo:${repo.owner}/${repo.repo}`
        q: `type:pr is:open ${criteria} repo:TMD-DX-Mobile/hbmc`
    });
    // console.log(`Query='type:pr is:open ${criteria} repo:${repo.owner}/${repo.repo}'`);
    console.log(`Query='type:pr is:open ${criteria} repo:TMD-DX-Mobile/hbmc'`);
    console.log(`data=${data}`);

    console.log(`Number of PRs where ${criteria}: ${data.total_count}`);
    return data.total_count;
  } catch (error) {
    console.error('Error while retrieving PRs:', error.message);
    return 0;
  }
}
