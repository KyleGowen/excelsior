# GitHub Actions CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and deployment following industry best practices.

## Workflows

### 1. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

#### Build and Test Job
- **Runs on:** Ubuntu Latest
- **Steps:**
  1. Checkout code
  2. Setup Node.js 20 with npm caching
  3. Install dependencies with `npm ci`
  4. Build project with `npm run build`
  5. Run unit tests with `npm run test:unit`
  6. Run linting (if available)

#### Deploy Job (Production Only)
- **Runs on:** Ubuntu Latest
- **Triggers:** Only on push to `main` branch
- **Prerequisites:** Build and Test job must pass
- **Steps:**
  1. Checkout code
  2. Configure AWS credentials
  3. Login to Amazon ECR
  4. Build Docker image (no cache, AMD64 platform)
  5. Tag and push image to ECR
  6. Create environment file on EC2
  7. Deploy container to EC2
  8. Verify deployment

### 2. Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches
- Push to `develop` branch

**Jobs:**

#### Test Job
- **Runs on:** Ubuntu Latest
- **Steps:**
  1. Checkout code
  2. Setup Node.js 20 with npm caching
  3. Install dependencies with `npm ci`
  4. Build project with `npm run build`
  5. Run unit tests with `npm run test:unit`
  6. Run unit tests with coverage
  7. Upload coverage reports to Codecov

## Best Practices Implemented

### Security
- ✅ AWS credentials stored as GitHub Secrets
- ✅ No hardcoded secrets in workflow files
- ✅ ECR authentication using official AWS actions
- ✅ Least privilege principle for AWS permissions

### Performance
- ✅ npm caching for faster builds
- ✅ Docker layer caching where possible
- ✅ Parallel job execution where appropriate
- ✅ No-cache Docker builds for production deployments

### Reliability
- ✅ Fail-fast on build or test failures
- ✅ Proper error handling and exit codes
- ✅ Deployment verification steps
- ✅ Rollback capability through container management

### Maintainability
- ✅ Clear job separation (build/test vs deploy)
- ✅ Environment variables for configuration
- ✅ Reusable workflow patterns
- ✅ Comprehensive logging and notifications

### Monitoring
- ✅ Build status notifications
- ✅ Test coverage reporting
- ✅ Deployment verification
- ✅ Container status checks

## Required GitHub Secrets

The following secrets must be configured in your GitHub repository settings:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

### Setting up AWS Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

### AWS IAM Permissions Required

The AWS credentials need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation"
      ],
      "Resource": "arn:aws:ssm:us-west-2:*:document/AWS-RunShellScript"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand"
      ],
      "Resource": "arn:aws:ec2:us-west-2:*:instance/i-0dee560af076c0f9d"
    }
  ]
}
```

## Environment Configuration

### Production Environment Variables

The deployment automatically sets these environment variables on the EC2 instance:

```bash
DATABASE_URL=postgresql://postgres:TempPassword123!@op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require
DB_HOST=op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=overpower
DB_USER=postgres
DB_PASSWORD=TempPassword123!
DB_USERNAME=postgres
NODE_ENV=production
PORT=3000
NODE_TLS_REJECT_UNAUTHORIZED=0
FLYWAY_URL=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require
FLYWAY_USER=postgres
FLYWAY_PASSWORD=TempPassword123!
```

## Deployment Process

### Automatic Deployment
1. Developer pushes code to `main` branch
2. GitHub Actions triggers build and test job
3. If tests pass, deployment job runs automatically
4. Docker image is built and pushed to ECR
5. Container is deployed to EC2 instance
6. Deployment is verified

### Manual Deployment
You can also trigger deployments manually:
1. Go to Actions tab in GitHub
2. Select "Build, Test, and Deploy" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Monitoring and Troubleshooting

### Viewing Workflow Runs
1. Go to the Actions tab in your GitHub repository
2. Click on the workflow run to see detailed logs
3. Expand individual steps to see command output

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are properly declared
- Check for TypeScript compilation errors

#### Test Failures
- Review test output in the Actions logs
- Ensure all tests are passing locally
- Check for environment-specific test issues

#### Deployment Failures
- Verify AWS credentials are correctly configured
- Check EC2 instance status and connectivity
- Review ECR repository permissions
- Check Docker image build logs

#### Container Issues
- Check container logs: `docker logs overpower-deckbuilder`
- Verify environment variables are set correctly
- Check database connectivity
- Review application startup logs

### Rollback Process

If a deployment fails or causes issues:

1. **Quick Rollback:**
   ```bash
   # SSH into EC2 instance and restart with previous image
   docker stop overpower-deckbuilder
   docker rm overpower-deckbuilder
   docker run -d --name overpower-deckbuilder --restart unless-stopped -p 3000:3000 --env-file /opt/app/.env [previous-image-tag]
   ```

2. **Revert Code:**
   - Create a new branch from the last known good commit
   - Push the revert commit to `main`
   - This will trigger a new deployment with the previous working code

## Workflow Customization

### Adding New Test Types
To add integration tests or other test suites:

1. Add the test command to `package.json`
2. Update the workflow to include the new test step
3. Consider adding test-specific environment variables if needed

### Modifying Deployment Steps
To change deployment behavior:

1. Edit the deploy job steps in `.github/workflows/deploy.yml`
2. Test changes in a feature branch first
3. Consider adding additional verification steps

### Environment-Specific Deployments
To add staging or other environments:

1. Create new workflow files for each environment
2. Use different trigger conditions (branches, tags)
3. Configure environment-specific secrets and variables
4. Update EC2 instance IDs and ECR repositories as needed

## References

This CI/CD setup follows best practices from:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECR GitHub Actions](https://github.com/aws-actions/amazon-ecr-login)
- [Node.js GitHub Actions](https://github.com/actions/setup-node)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS SSM Best Practices](https://docs.aws.amazon.com/systems-manager/latest/userguide/best-practices.html)
