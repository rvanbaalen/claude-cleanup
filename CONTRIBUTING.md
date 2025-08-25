# Contributing to claude-cleanup

Thank you for your interest in contributing to claude-cleanup! We welcome contributions from the community.

## Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages. This allows us to automatically generate changelogs and handle semantic versioning.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

### Examples

```
feat: add --exclude-backups flag to skip backup files
fix: handle missing .claude.json file gracefully
docs: update README with new usage examples
chore: update dependencies
```

### Breaking Changes

Breaking changes should be indicated by placing `!` after the type/scope, and explained in the commit body or footer:

```
feat!: remove deprecated --legacy-mode flag

BREAKING CHANGE: The --legacy-mode flag has been removed. Use the new --format flag instead.
```

## Release Process

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases. When you follow conventional commits, release-please will:

- Automatically bump the version number based on your commits
- Generate a changelog
- Create a GitHub release
- Publish to npm

## Development

1. Fork the repository
2. Create a feature branch
3. Make your changes following conventional commits
4. Test your changes
5. Submit a pull request

Thank you for contributing!