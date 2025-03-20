# Contributing to Multi-Platform AI Bots

Thank you for your interest in contributing to the Multi-Platform AI Bots project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Set up the development environment** by following the instructions below

### Development Environment Setup

1. Ensure you have Node.js v20.x installed (v20.11.1 recommended)
   ```bash
   # Check your Node.js version
   node --version
   
   # If using nvm, you can install and use the correct version
   nvm install 20.11.1
   nvm use 20.11.1
   ```

2. Install pnpm (v8.15.4 or later)
   ```bash
   npm install -g pnpm
   
   # Verify pnpm version
   pnpm --version
   ```

3. Run the setup script
   ```bash
   # Make the script executable
   chmod +x bin/setup.sh
   
   # Run the setup script
   ./bin/setup.sh
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branches

- `main` - The main development branch
- `release/*` - Release branches
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Pull Request Process

1. Create a new branch from `main` with a descriptive name
2. Make your changes in the branch
3. Ensure your code follows the project's coding standards
4. Update documentation as necessary
5. Submit a pull request to the `main` branch

### Commit Messages

Please follow these guidelines for commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add bot authentication for TikTok platform

- Implement OAuth flow for TikTok
- Add credential storage
- Update documentation

Fixes #123
```

## Code Style

### JavaScript/TypeScript

- Use ES6+ features
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes and components

### CSS

- Use 2 spaces for indentation
- Use kebab-case for class names
- Use CSS variables for theming

## Package Management

This project uses pnpm for package management. Please do not use npm or yarn.

### Adding Dependencies

```bash
# Add a production dependency
pnpm add package-name

# Add a development dependency
pnpm add -D package-name
```

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update a specific dependency
pnpm update package-name
```

## Testing

- Write tests for all new features and bug fixes
- Ensure all tests pass before submitting a pull request
- Aim for high test coverage

To run tests:
```bash
pnpm test
```

## Documentation

- Update documentation for any changes to the API or UI
- Document new features thoroughly
- Keep the README.md up to date

## Reporting Bugs

When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (OS, browser, Node.js version, pnpm version)

## Feature Requests

Feature requests are welcome! Please provide:

- A clear and descriptive title
- A detailed description of the proposed feature
- Any relevant examples or mockups
- Explanation of why this feature would be useful

## Review Process

All submissions require review. We use GitHub pull requests for this purpose.

1. Submit your pull request
2. Wait for feedback from maintainers
3. Make any requested changes
4. Once approved, your changes will be merged

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have any questions about contributing, please open an issue or contact the maintainers.

Thank you for your contributions!