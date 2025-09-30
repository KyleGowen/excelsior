# Setting up GitHub Secrets for CI/CD

This guide will help you configure the required secrets for the GitHub Actions CI/CD pipeline.

## Required Secrets

You need to set up the following secrets in your GitHub repository:

1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`

## Step-by-Step Setup

### 1. Create AWS IAM User

First, create an IAM user with the necessary permissions:

1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Username: `github-actions-deploy`
4. Select "Programmatic access"
5. Attach the policy below (or create a custom policy)

### 2. IAM Policy for GitHub Actions

Create a policy with these permissions:

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

### 3. Get AWS Credentials

After creating the IAM user:

1. Go to the user's "Security credentials" tab
2. Click "Create access key"
3. Select "Application running outside AWS"
4. Copy the Access Key ID and Secret Access Key
5. **Important:** Download the CSV file or copy these values immediately - you won't be able to see the secret again

### 4. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click "Settings" (in the repository menu)
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: [Your AWS Access Key ID]

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: [Your AWS Secret Access Key]

6. Click "Add secret" for each one

### 5. Verify Setup

1. Go to the "Actions" tab in your repository
2. You should see the workflows listed
3. Try pushing a small change to the `main` branch
4. Check that the workflow runs successfully

## Security Best Practices

- ✅ Use a dedicated IAM user for GitHub Actions
- ✅ Apply the principle of least privilege
- ✅ Rotate access keys regularly
- ✅ Monitor access key usage in CloudTrail
- ✅ Never commit secrets to your repository
- ✅ Use different credentials for different environments

## Troubleshooting

### Common Issues

**"Access Denied" errors:**
- Check that the IAM policy includes all required permissions
- Verify the access key is correct
- Ensure the user has the right permissions

**"ECR login failed":**
- Check that the ECR repository exists
- Verify the region is correct (us-west-2)
- Ensure the IAM user has ECR permissions

**"SSM command failed":**
- Check that the EC2 instance ID is correct
- Verify the instance is running
- Ensure the IAM user has SSM permissions

**"Docker build failed":**
- Check that the Dockerfile exists
- Verify all dependencies are available
- Check for any build errors in the logs

### Getting Help

If you encounter issues:

1. Check the Actions tab for detailed error logs
2. Verify all secrets are set correctly
3. Test AWS credentials locally with AWS CLI
4. Check EC2 instance status and connectivity
5. Review IAM permissions and policies

## Next Steps

Once secrets are configured:

1. The CI/CD pipeline will run automatically on pushes to `main`
2. Pull requests will run tests but not deploy
3. You can monitor deployments in the Actions tab
4. Set up notifications for deployment success/failure if desired

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [ECR GitHub Actions](https://github.com/aws-actions/amazon-ecr-login)
- [AWS SSM Documentation](https://docs.aws.amazon.com/systems-manager/)
