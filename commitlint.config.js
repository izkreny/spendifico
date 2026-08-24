// scope-empty enforces "a branch commit header carries no scope", which docs/CONTRIBUTING.md
// states in prose and nothing else checked. commitlint sees every branch commit twice - locally
// through .husky/commit-msg, and in CI over the whole branch range - so the rule fires on exactly
// the thing the convention forbids.
//
// The scope that does exist lives on the pull request title, which GitHub turns into the squash
// subject on main. Nothing lints that: the CI step is guarded by
// `if: github.event_name == 'pull_request'` and no step reads a PR title. So the PR title's scope
// is enforced by review rather than by this file, and that asymmetry is deliberate.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
