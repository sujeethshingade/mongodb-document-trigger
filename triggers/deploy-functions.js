const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const CONFIG = {
  ATLAS_PUBLIC_KEY: process.env.ATLAS_PUBLIC_KEY,
  ATLAS_PRIVATE_KEY: process.env.ATLAS_PRIVATE_KEY,
  ATLAS_PROJECT_ID: process.env.ATLAS_PROJECT_ID,
  ATLAS_APP_ID: process.env.ATLAS_APP_ID,
  ATLAS_BASE_URL: 'https://realm.mongodb.com/api/admin/v3.0'
};

let authenticatedClient = null;

// Validate config and create authenticated client
async function createAtlasClient() {
  if (authenticatedClient) return authenticatedClient;

  const required = ['ATLAS_PUBLIC_KEY', 'ATLAS_PRIVATE_KEY', 'ATLAS_PROJECT_ID', 'ATLAS_APP_ID'];
  const missing = required.filter(key => !CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing.join(', '));
    process.exit(1);
  }

  try {
    console.log('Authenticating with Atlas App Services');
    const authResponse = await axios.post(`${CONFIG.ATLAS_BASE_URL}/auth/providers/mongodb-cloud/login`, {
      username: CONFIG.ATLAS_PUBLIC_KEY,
      apiKey: CONFIG.ATLAS_PRIVATE_KEY
    }, { timeout: 10000 });

    authenticatedClient = axios.create({
      baseURL: CONFIG.ATLAS_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResponse.data.access_token}`
      }
    });

    console.log('Authentication successful!');
    return authenticatedClient;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw new Error('Atlas authentication failed. Please check your credentials.');
  }
}

// Deploy or update a function
async function deployFunction(client, functionName, functionCode) {
  try {
    console.log(`Checking if function exists: ${functionName}`);
    const response = await client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`);
    const existingFunction = response.data.find(func => func.name === functionName);
    
    const functionPayload = {
      name: functionName,
      source: functionCode,
      run_as_system: true,
      private: false,
      can_evaluate: {}
    };

    if (existingFunction) {
      console.log(`Updating function: ${functionName}`);
      const updateResponse = await client.put(
        `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions/${existingFunction._id}`,
        functionPayload
      );
      console.log(`Successfully updated function: ${functionName} (ID: ${existingFunction._id})`);
      return updateResponse.data;
    } else {
      console.log(`Creating function: ${functionName}`);
      const createResponse = await client.post(
        `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`,
        functionPayload
      );
      console.log(`Successfully created function: ${functionName} (ID: ${createResponse.data._id})`);
      return createResponse.data;
    }
  } catch (error) {
    console.error(`Error deploying function ${functionName}:`, error.response?.data || error.message);
    throw error;
  }
}

// Read function code from file with fallback
function getAuditLogFunctionCode() {
  const functionFilePath = path.join(__dirname, 'auditLogFunction.js');
  
  if (fs.existsSync(functionFilePath)) {
    console.log('Reading function code from file:', functionFilePath);
    return fs.readFileSync(functionFilePath, 'utf8');
  }
  
  console.log('auditLogFunction.js file not found, using fallback');
  return `exports = async function(changeEvent) {
    console.log("Basic audit function - please create auditLogFunction.js");
    return { error: "Function file not found" };
};`;
}

// Main function to deploy functions
async function deployFunctions() {
  console.log('Starting Functions deployment\n');

  try {
    const client = await createAtlasClient();
    const functionCode = getAuditLogFunctionCode();
    const deployedFunction = await deployFunction(client, 'auditLogFunction', functionCode);
    
    console.log('Deployed function');
    return { success: true, deployed: [deployedFunction] };
  } catch (error) {
    console.error('Deployment failed:', error.message);
    throw error;
  }
}

// Run the deployment if this file is executed directly
if (require.main === module) {
  deployFunctions().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = { deployFunctions, deployFunction, getAuditLogFunctionCode };