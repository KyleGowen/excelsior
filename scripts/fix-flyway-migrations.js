const { execSync } = require('child_process');

async function fixFlywayMigrations() {
  console.log('🔧 Fixing Flyway migration issues...');
  
  try {
    const awsRegion = 'us-west-2';
    const instanceId = 'i-04493611b99785f28';
    
    console.log('📋 Instance ID:', instanceId);
    console.log('📋 Region:', awsRegion);
    
    // First, let's see what migrations are in the database
    console.log('\n🔍 Checking current migration status...');
    const statusCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations info"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for migration status...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const statusOutput = execSync(`aws ssm get-command-invocation --command-id ${statusCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Migration status:');
    console.log(statusOutput);
    
    // Repair the schema history to fix checksum mismatch
    console.log('\n🔧 Repairing Flyway schema history...');
    const repairCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations repair"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for repair to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const repairOutput = execSync(`aws ssm get-command-invocation --command-id ${repairCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Repair output:');
    console.log(repairOutput);
    
    // Now try to run migrations with outOfOrder=true to apply pending migrations
    console.log('\n🔧 Running pending migrations...');
    const migrateCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations -outOfOrder=true migrate"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for migrations to complete...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const migrateOutput = execSync(`aws ssm get-command-invocation --command-id ${migrateCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Migration output:');
    console.log(migrateOutput);
    
    // Check if the container is now running properly
    console.log('\n🔍 Checking container status...');
    const containerStatus = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker ps | grep overpower-app"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for container status...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const containerOutput = execSync(`aws ssm get-command-invocation --command-id ${containerStatus} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Container status:');
    console.log(containerOutput);
    
    // Test if the application is responding
    console.log('\n🔍 Testing application health...');
    const healthCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["curl -I http://localhost:3000/health"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for health check...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const healthOutput = execSync(`aws ssm get-command-invocation --command-id ${healthCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Health check:');
    console.log(healthOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFlywayMigrations();
