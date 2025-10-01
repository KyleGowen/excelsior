#!/bin/bash

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:1337/overpower"
export NODE_ENV="test"
export PORT="3000"

# Function to run tests with timeout
run_tests_with_timeout() {
    echo "🚀 Starting integration tests with 60 second timeout..."
    
    # Run tests with timeout
    timeout 60s npm run test:integration 2>&1 | tee integration-test-output.log
    
    # Check exit code
    exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        echo "❌ Tests timed out after 60 seconds"
        echo "📋 Last 50 lines of output:"
        tail -50 integration-test-output.log
        return 1
    elif [ $exit_code -eq 0 ]; then
        echo "✅ All tests passed!"
        return 0
    else
        echo "❌ Tests failed with exit code $exit_code"
        echo "📋 Last 50 lines of output:"
        tail -50 integration-test-output.log
        return 1
    fi
}

# Run the tests
run_tests_with_timeout
