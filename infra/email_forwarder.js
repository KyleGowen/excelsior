// Use the built-in AWS SDK v3 that's available in Node.js 18.x runtime
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the S3 event (emails are stored in S3 by SES)
        const { Records } = event;
        
        for (const record of Records) {
            if (record.eventSource === 'aws:s3') {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
                
                console.log(`Processing email from S3: ${bucket}/${key}`);
                
                    // Get the raw email from S3
                    const getObjectCommand = new GetObjectCommand({ 
                        Bucket: bucket, 
                        Key: key 
                    });
                    const data = await s3Client.send(getObjectCommand);
                    
                    const rawEmail = await data.Body.transformToString();
                console.log('Raw email retrieved from S3');
                
                // Parse and modify the email headers for proper forwarding
                const lines = rawEmail.split('\n');
                let modifiedEmail = '';
                let inHeaders = true;
                let originalFrom = '';
                let originalTo = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    if (inHeaders) {
                        if (line.trim() === '') {
                            // End of headers
                            inHeaders = false;
                            // Add forwarding headers before the body
                            modifiedEmail += `X-Forwarded-For: ${process.env.FROM_EMAIL}\n`;
                            modifiedEmail += `X-Original-From: ${originalFrom}\n`;
                            modifiedEmail += `X-Original-To: ${originalTo}\n`;
                            modifiedEmail += `Reply-To: ${process.env.FROM_EMAIL}\n`;
                            modifiedEmail += line + '\n';
                        } else if (line.toLowerCase().startsWith('from:')) {
                            originalFrom = line.substring(5).trim();
                            // Change From header to use verified Gmail address
                            modifiedEmail += `From: ${process.env.FORWARD_TO_EMAIL}\n`;
                        } else if (line.toLowerCase().startsWith('to:')) {
                            originalTo = line.substring(3).trim();
                            // Change To header to forward address
                            modifiedEmail += `To: ${process.env.FORWARD_TO_EMAIL}\n`;
                        } else {
                            // Keep other headers as-is
                            modifiedEmail += line + '\n';
                        }
                    } else {
                        // Body content - keep as-is
                        modifiedEmail += line + '\n';
                    }
                }
                
                // Forward the modified email using SES
                const sendRawEmailCommand = new SendRawEmailCommand({
                    Destinations: [process.env.FORWARD_TO_EMAIL],
                    RawMessage: { 
                        Data: Buffer.from(modifiedEmail, 'utf8')
                    },
                    Source: process.env.FORWARD_TO_EMAIL // Use Gmail as source since it's verified for sending
                });
                
                const result = await sesClient.send(sendRawEmailCommand);
                console.log('Email forwarded successfully:', result.MessageId);
                
                // Optional: Delete the email from S3 after forwarding
                // await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
                // console.log('Email deleted from S3');
                
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'Email forwarded successfully',
                        messageId: result.MessageId
                    })
                };
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'No S3 records to process'
            })
        };
        
    } catch (error) {
        console.error('Error processing email:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process email',
                details: error.message
            })
        };
    }
};
