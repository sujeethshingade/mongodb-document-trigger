const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local file
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration - these should be set as environment variables
const CONFIG = {
  ATLAS_PUBLIC_KEY: process.env.ATLAS_PUBLIC_KEY,
  ATLAS_PRIVATE_KEY: process.env.ATLAS_PRIVATE_KEY,
  ATLAS_PROJECT_ID: process.env.ATLAS_PROJECT_ID,
  ATLAS_APP_ID: process.env.ATLAS_APP_ID,
  ATLAS_BASE_URL: 'https://realm.mongodb.com/api/admin/v3.0'
};

// Global variable to store authenticated client
let authenticatedClient = null;

// Validate required environment variables
function validateConfig() {
  const required = ['ATLAS_PUBLIC_KEY', 'ATLAS_PRIVATE_KEY', 'ATLAS_PROJECT_ID', 'ATLAS_APP_ID'];
  const missing = required.filter(key => !CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these in your .env.local file or environment variables');
    process.exit(1);
  }
}

// Authenticate and create Atlas client
async function createAtlasClient() {
  if (authenticatedClient) {
    return authenticatedClient;
  }

  try {
    const authClient = axios.create({
      baseURL: CONFIG.ATLAS_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔐 Authenticating with Atlas App Services...');
    const authResponse = await authClient.post('/auth/providers/mongodb-cloud/login', {
      username: CONFIG.ATLAS_PUBLIC_KEY,
      apiKey: CONFIG.ATLAS_PRIVATE_KEY
    });

    authenticatedClient = axios.create({
      baseURL: CONFIG.ATLAS_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResponse.data.access_token}`
      }
    });

    console.log('✅ Authentication successful!');
    return authenticatedClient;

  } catch (error) {
    console.error('❌ Authentication failed:', error.code || error.response?.data || error.message);
    throw new Error('Atlas authentication failed. Please check your credentials.');
  }
}

// Check if function already exists
async function getFunctionByName(client, functionName) {
  try {
    console.log(`🔍 Checking if function exists: ${functionName}`);
    const response = await client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`);
    const functions = response.data;
    const existingFunction = functions.find(func => func.name === functionName);
    
    if (existingFunction) {
      console.log(`✅ Function exists: ${functionName} (ID: ${existingFunction._id})`);
      return existingFunction;
    } else {
      console.log(`ℹ️  Function '${functionName}' does not exist yet`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking functions:', error.response?.data || error.message);
    throw error;
  }
}

// Create a new function
async function createFunction(client, functionName, functionCode) {
  try {
    console.log(`📝 Creating function: ${functionName}`);
    
    const functionPayload = {
      name: functionName,
      source: functionCode,
      run_as_system: true,
      private: false,
      can_evaluate: {}
    };

    const response = await client.post(
      `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`,
      functionPayload
    );

    console.log(`✅ Successfully created function: ${functionName} (ID: ${response.data._id})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating function ${functionName}:`, error.response?.data || error.message);
    throw error;
  }
}

// Update an existing function
async function updateFunction(client, functionId, functionName, functionCode) {
  try {
    console.log(`📝 Updating function: ${functionName}`);
    
    const functionPayload = {
      name: functionName,
      source: functionCode,
      run_as_system: true,
      private: false,
      can_evaluate: {}
    };

    const response = await client.put(
      `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions/${functionId}`,
      functionPayload
    );

    console.log(`✅ Successfully updated function: ${functionName} (ID: ${functionId})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating function ${functionName}:`, error.response?.data || error.message);
    throw error;
  }
}

// Deploy or update a function
async function deployFunction(client, functionName, functionCode) {
  try {
    // Check if function already exists
    const existingFunction = await getFunctionByName(client, functionName);
    
    if (existingFunction) {
      // Update existing function
      return await updateFunction(client, existingFunction._id, functionName, functionCode);
    } else {
      // Create new function
      return await createFunction(client, functionName, functionCode);
    }
  } catch (error) {
    console.error(`❌ Error deploying function ${functionName}:`, error.message);
    throw error;
  }
}

// Read function code from file or return default audit log function
function getAuditLogFunctionCode() {
  // Try to read from file first
  const functionFilePath = path.join(__dirname, 'auditLogFunction.js');
  
  if (fs.existsSync(functionFilePath)) {
    console.log('📖 Reading function code from file:', functionFilePath);
    return fs.readFileSync(functionFilePath, 'utf8');
  }
  
  // This should not happen now since we created the file
  console.log('⚠️  auditLogFunction.js file not found, using fallback');
  return `
exports = async function(changeEvent) {
    console.log("Basic audit function - please create auditLogFunction.js");
    return { error: "Function file not found" };
};`.trim();
}

// Main function to deploy functions
async function deployFunctions() {
  console.log('🚀 Starting MongoDB Atlas Functions deployment...\n');
  
  validateConfig();
  const client = await createAtlasClient();
  
  const results = {
    deployed: [],
    errors: []
  };

  try {
    // Deploy audit log function
    const functionCode = getAuditLogFunctionCode();
    const deployedFunction = await deployFunction(client, 'auditLogFunction', functionCode);
    results.deployed.push(deployedFunction);
    
  } catch (error) {
    results.errors.push({
      functionName: 'auditLogFunction',
      error: error.message
    });
  }

  // Print summary
  console.log('\n📊 Deployment Summary:');
  console.log(`✅ Deployed: ${results.deployed.length} functions`);
  console.log(`❌ Errors: ${results.errors.length} functions`);
  
  if (results.deployed.length > 0) {
    console.log('\n🆕 Deployed Functions:');
    results.deployed.forEach(func => console.log(`  - ${func.name} (${func._id})`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error.functionName}: ${error.error}`));
  }
  
  console.log('\n🎉 Functions deployment completed!');
}

// Run the deployment if this file is executed directly
if (require.main === module) {
  deployFunctions().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  deployFunctions,
  deployFunction,
  getAuditLogFunctionCode
};