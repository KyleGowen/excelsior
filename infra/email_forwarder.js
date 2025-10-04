// Use the built-in AWS SDK that's available in Node.js 16.x runtime
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });
const s3 = new AWS.S3();
const ses = new AWS.SES();

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
                
                // Parse and modify the email headers for proper forwarding
                const lines = rawEmail.split('\n');
                let modifiedEmail = '';
                let inHeaders = true;
                let originalFrom = '';
                let originalTo = '';
                
                console.log('Environment variables:', {
                    FORWARD_TO_EMAIL: process.env.FORWARD_TO_EMAIL,
                    FROM_EMAIL: process.env.FROM_EMAIL
                });
                
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
                            modifiedEmail += `Reply-To: ${originalFrom}\n`;
                            modifiedEmail += line + '\n';
                        } else if (line.toLowerCase().startsWith('from:')) {
                            originalFrom = line.substring(5).trim();
                            console.log('Original From header:', originalFrom);
                            // Use verified Gmail address but make it clear who the original sender was
                            modifiedEmail += `From: ${process.env.FORWARD_TO_EMAIL}\n`;
                            console.log('Modified From header to:', process.env.FORWARD_TO_EMAIL);
                        } else if (line.toLowerCase().startsWith('to:')) {
                            originalTo = line.substring(3).trim();
                            console.log('Original To header:', originalTo);
                            // Change To header to forward address
                            modifiedEmail += `To: ${process.env.FORWARD_TO_EMAIL}\n`;
                            console.log('Modified To header to:', process.env.FORWARD_TO_EMAIL);
                        } else if (line.toLowerCase().startsWith('return-path:')) {
                            console.log('Original Return-Path header:', line);
                            // Change Return-Path header to use verified Gmail address
                            modifiedEmail += `Return-Path: <${process.env.FORWARD_TO_EMAIL}>\n`;
                            console.log('Modified Return-Path header to:', process.env.FORWARD_TO_EMAIL);
                        } else if (line.toLowerCase().startsWith('reply-to:')) {
                            console.log('Original Reply-To header:', line);
                            // Skip the original Reply-To header since we'll add our own
                            console.log('Skipping original Reply-To header, will add our own');
                        } else {
                            // Keep other headers as-is
                            modifiedEmail += line + '\n';
                        }
                    } else {
                        // Body content - add subtle forwarding notice at the beginning
                        if (line.trim() === '' && !modifiedEmail.includes('--- FORWARDED EMAIL ---')) {
                            modifiedEmail += `\n`;
                            modifiedEmail += `--- Forwarded message ---\n`;
                            modifiedEmail += `From: ${originalFrom}\n`;
                            modifiedEmail += `Date: ${new Date().toLocaleString()}\n`;
                            modifiedEmail += `Subject: [FORWARDED] Original email\n`;
                            modifiedEmail += `To: ${originalTo}\n\n`;
                            modifiedEmail += `[This email was forwarded from ${originalTo} to ${process.env.FORWARD_TO_EMAIL}]\n`;
                            modifiedEmail += `[To reply to the original sender, use: ${originalFrom}]\n\n`;
                        }
                        modifiedEmail += line + '\n';
                    }
                }
                
                console.log('Modified email preview (first 500 chars):', modifiedEmail.substring(0, 500));
                
                // Forward the modified email using SES
                const result = await ses.sendRawEmail({
                    Destinations: [process.env.FORWARD_TO_EMAIL],
                    RawMessage: { 
                        Data: modifiedEmail
                    },
                    Source: process.env.FORWARD_TO_EMAIL // Use Gmail as source since it's verified for sending
                }).promise();
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
