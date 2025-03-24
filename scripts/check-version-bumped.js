/* eslint-disable */

module.exports = async ({core, github, context}) => {
  if (context.eventName !== 'pull_request') {
    core.info('This action is only applicable for pull_request event.');
    return;
  }

  const diff = await github.rest.repos.compareCommits({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: context.payload.pull_request.base.sha,
    head: context.payload.pull_request.head.sha,
  });

  if (!diff.data.files) {
    core.info('No files changed in this Pull Request.');
    return;
  }
  const packageJsonDiff = diff.data.files.find(file => file.filename === 'package.json');
  if (!packageJsonDiff) {
    core.setFailed('package.json file has not been modified in this Pull Request. Bump the version using `yarn bump-version` command.');
    return;
  }

  const versionChangeRegex = /"version":\s*"(.+)"/;
  const oldVersionMatch = versionChangeRegex.exec(
    packageJsonDiff.patch.split('\n')
      .find(line => line.startsWith('-'))
  );
  const newVersionMatch = versionChangeRegex.exec(
    packageJsonDiff.patch.split('\n')
      .find(line => line.startsWith('+'))
  );


  if (!oldVersionMatch || !newVersionMatch || oldVersionMatch[1] === newVersionMatch[1]) {
    core.setFailed('The version in package.json has not been modified. Bump the version using `yarn bump-version` command.');
    return;
  }

  core.info('Version check passed.');
}
