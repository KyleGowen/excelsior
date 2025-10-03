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
                
                // Forward the raw email using SES
                const sendRawEmailCommand = new SendRawEmailCommand({
                    Destinations: [process.env.FORWARD_TO_EMAIL],
                    RawMessage: { 
                        Data: Buffer.from(rawEmail, 'utf8')
                    },
                    Source: process.env.FROM_EMAIL // must be verified in SES
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
