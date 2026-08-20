// There is deliberately no scope-enum here. Branch commits carry no scope at all, and
// the scope that does exist - on a pull request title, which GitHub turns into the squash
// subject - is never seen by commitlint: .github/workflows/ci.yml guards the commitlint
// step with `if: github.event_name == 'pull_request'`, so it never runs on a push to main,
// and no step lints a PR title. A scope-enum here could not fire.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
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
