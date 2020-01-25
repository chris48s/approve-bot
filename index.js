const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error("Event payload missing `pull_request`");
    }

    if (
      ["dependabot[bot]", "dependabot-preview[bot]"].includes(pr.user.login) &&
      pr.body.includes(
        "If all status checks pass Dependabot will automatically merge this pull request"
      )
    ) {
      const client = new github.GitHub(token);

      core.debug(`Adding label to pull request #${pr.number}`);
      await client.issues.addLabels({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pr.number,
        labels: ["squash when passing"]
      })

      core.debug(`Creating approving review for pull request #${pr.number}`);
      await client.pulls.createReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr.number,
        event: "APPROVE"
      });

      core.debug(`Done.`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
