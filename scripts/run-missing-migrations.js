const { execSync } = require('child_process');

async function runMissingMigrations() {
  console.log('🔧 Running missing Flyway migrations (V166, V170, V171)...');
  
  try {
    const awsRegion = 'us-west-2';
    const instanceId = 'i-04493611b99785f28';
    
    console.log('📋 Instance ID:', instanceId);
    console.log('📋 Region:', awsRegion);
    
    // First, check current migration status
    console.log('\n🔍 Checking current migration status...');
    const statusCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations info"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for migration status...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const statusOutput = execSync(`aws ssm get-command-invocation --command-id ${statusCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Current migration status:');
    console.log(statusOutput);
    
    // Check if migrations V166, V170, V171 are already applied
    if (statusOutput.includes('V166') && statusOutput.includes('V170') && statusOutput.includes('V171')) {
      console.log('\n✅ All migrations (V166, V170, V171) are already applied!');
      return;
    }
    
    // Run migrations with outOfOrder=true since V166 was created after V167-V169 were already applied
    console.log('\n🔄 Running pending migrations (out of order)...');
    const migrateCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations -outOfOrder=true migrate"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    console.log('⏳ Waiting for migrations to complete...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const migrateOutput = execSync(`aws ssm get-command-invocation --command-id ${migrateCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Migration output:');
    console.log(migrateOutput);
    
    // Check for errors
    if (migrateOutput.includes('ERROR') || migrateOutput.includes('Failed')) {
      console.error('\n❌ Migration failed! Check the output above for details.');
      process.exit(1);
    }
    
    // Verify migrations were applied
    console.log('\n🔍 Verifying migrations were applied...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const verifyCommand = execSync(`aws ssm send-command --instance-ids ${instanceId} --region ${awsRegion} --document-name "AWS-RunShellScript" --parameters 'commands=["docker exec overpower-app flyway -url=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require -user=postgres -password=TempPassword123! -locations=filesystem:/app/migrations info"]' --query 'Command.CommandId' --output text`, { encoding: 'utf8' }).trim();
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const verifyOutput = execSync(`aws ssm get-command-invocation --command-id ${verifyCommand} --instance-id ${instanceId} --region ${awsRegion} --query 'StandardOutputContent' --output text`, { encoding: 'utf8' });
    console.log('📋 Verification output:');
    console.log(verifyOutput);
    
    // Check if all three migrations are now present and applied
    const hasV166 = verifyOutput.includes('Versioned | 166') && (verifyOutput.includes('Success') || verifyOutput.includes('Out of Order'));
    const hasV170 = verifyOutput.includes('Versioned | 170') && verifyOutput.includes('Success');
    const hasV171 = verifyOutput.includes('Versioned | 171') && verifyOutput.includes('Success');
    
    if (hasV166 && hasV170 && hasV171) {
      console.log('\n✅ Success! All migrations (V166, V170, V171) have been applied.');
      console.log('   - V166: Applied (out of order)');
      console.log('   - V170: Applied successfully');
      console.log('   - V171: Applied successfully');
    } else {
      console.log('\n⚠️  Warning: Some migrations may still be missing. Check the output above.');
      console.log(`   - V166: ${hasV166 ? '✅' : '❌'}`);
      console.log(`   - V170: ${hasV170 ? '✅' : '❌'}`);
      console.log(`   - V171: ${hasV171 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMissingMigrations();

