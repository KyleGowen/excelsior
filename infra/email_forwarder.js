const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ses = new AWS.SES({ region: process.env.AWS_REGION });

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
                const data = await s3.getObject({ 
                    Bucket: bucket, 
                    Key: key 
                }).promise();
                
                const rawEmail = data.Body.toString();
                console.log('Raw email retrieved from S3');
                
                // Forward the raw email using SES
                const forwardParams = {
                    Destinations: [process.env.FORWARD_TO_EMAIL],
                    RawMessage: { 
                        Data: rawEmail 
                    },
                    Source: process.env.FROM_EMAIL // must be verified in SES
                };
                
                const result = await ses.sendRawEmail(forwardParams).promise();
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
