const { execSync } = require('child_process');

async function checkProductionStatus() {
  console.log('🔍 Checking production status...');
  
  try {
    const awsRegion = 'us-west-2';
    const instanceId = 'i-04493611b99785f28';
    
    console.log(`📋 Instance ID: ${instanceId}`);
    console.log(`📋 Region: ${awsRegion}`);
    
    // Check if the instance is running
    console.log('\n🔍 Checking EC2 instance status...');
    const instanceStatus = execSync(`aws ec2 describe-instances --instance-ids ${instanceId} --region ${awsRegion} --query 'Reservations[0].Instances[0].State.Name' --output text`, { encoding: 'utf8' }).trim();
    console.log(`📋 Instance state: ${instanceStatus}`);
    
    if (instanceStatus !== 'running') {
      console.log('❌ Instance is not running!');
      return;
    }
    
    // Check Docker containers
    console.log('\n🔍 Checking Docker containers...');
    const dockerPs = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker ps -a"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    console.log(`📋 Docker check command ID: ${dockerPs}`);
    
    // Wait a moment for the command to complete
    console.log('⏳ Waiting for Docker status check...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the command output
    const dockerOutput = execSync(`aws ssm get-command-invocation --command-id ${dockerPs} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Docker containers:');
    console.log(dockerOutput);
    
    // Check application logs
    console.log('\n🔍 Checking application logs...');
    const logsCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker logs overpower-app --tail 50"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    console.log(`📋 Logs command ID: ${logsCommand}`);
    
    // Wait for logs
    console.log('⏳ Waiting for application logs...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const logsOutput = execSync(`aws ssm get-command-invocation --command-id ${logsCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Application logs:');
    console.log(logsOutput);
    
    // Check nginx status
    console.log('\n🔍 Checking nginx status...');
    const nginxCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["systemctl status nginx", "nginx -t"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    console.log(`📋 Nginx check command ID: ${nginxCommand}`);
    
    // Wait for nginx status
    console.log('⏳ Waiting for nginx status...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const nginxOutput = execSync(`aws ssm get-command-invocation --command-id ${nginxCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Nginx status:');
    console.log(nginxOutput);
    
    // Check if port 3000 is listening
    console.log('\n🔍 Checking if port 3000 is listening...');
    const portCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["netstat -tlnp | grep :3000", "curl -I http://localhost:3000/health"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    console.log(`📋 Port check command ID: ${portCommand}`);
    
    // Wait for port check
    console.log('⏳ Waiting for port check...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const portOutput = execSync(`aws ssm get-command-invocation --command-id ${portCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Port 3000 status:');
    console.log(portOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('   1. AWS CLI configured with proper credentials');
    console.log('   2. Access to the EC2 instance via SSM');
  }
}

checkProductionStatus();
