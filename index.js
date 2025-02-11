const core = require("@actions/core");
const github = require("@actions/github");
const { isPointlessGatsbyBump, shouldAutoMerge } = require("./helpers");

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error("Event payload missing `pull_request`");
    }

    const client = new github.GitHub(token);

    if (
      ["dependabot[bot]", "dependabot-preview[bot]"].includes(pr.user.login)
    ) {
      if (isPointlessGatsbyBump(pr.body)) {
        core.debug(`Closing pull request #${pr.number}`);
        await client.pulls.update({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pr.number,
          state: "closed",
        });

        core.debug(`Done.`);
      } else if (shouldAutoMerge(pr.body)) {
        core.debug(`Adding label to pull request #${pr.number}`);
        await client.issues.addLabels({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: pr.number,
          labels: ["squash when passing"],
        });

        core.debug(`Creating approving review for pull request #${pr.number}`);
        await client.pulls.createReview({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pr.number,
          event: "APPROVE",
        });

        core.debug(`Done.`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
