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

// Read trigger definitions from JSON file
function readTriggerDefinitions() {
  try {
    const triggersPath = path.join(__dirname, 'triggers.json');
    const triggersData = fs.readFileSync(triggersPath, 'utf8');
    return JSON.parse(triggersData);
  } catch (error) {
    console.error('❌ Error reading triggers.json:', error.message);
    process.exit(1);
  }
}

// Get function ID by function name
async function getFunctionIdByName(client, functionName) {
  try {
    console.log(`🔍 Looking up function: ${functionName}`);
    const response = await client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`);
    const functions = response.data;
    const targetFunction = functions.find(func => func.name === functionName);
    
    if (targetFunction) {
      console.log(`✅ Found function: ${functionName} (ID: ${targetFunction._id})`);
      return targetFunction._id;
    } else {
      console.warn(`⚠️  Function '${functionName}' not found. Available functions:`, functions.map(f => f.name));
      throw new Error(`Function '${functionName}' not found`);
    }
  } catch (error) {
    console.error('❌ Error fetching functions:', error.response?.data || error.message);
    throw error;
  }
}

// Get available services to find the correct cluster service
async function getClusterService(client) {
  try {
    console.log(`🔍 Looking up available services...`);
    const response = await client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/services`);
    const services = response.data;
    
    console.log(`📋 Available services:`, services.map(s => `${s.name} (${s.type})`));
    
    // Look for mongodb-atlas service (the cluster connection)
    const clusterService = services.find(service => service.type === 'mongodb-atlas');
    if (clusterService) {
      console.log(`✅ Found cluster service: ${clusterService.name} (ID: ${clusterService._id})`);
      return clusterService;
    } else {
      console.warn(`⚠️  No mongodb-atlas service found. Available services:`, services.map(s => `${s.name} (${s.type})`));
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching services:', error.response?.data || error.message);
    return null;
  }
}

// Create a single trigger with correct configuration
async function createTrigger(client, triggerDef) {
  try {
    console.log(`📝 Creating trigger: ${triggerDef.name}`);
    
    // Get the function ID by name
    const functionId = await getFunctionIdByName(client, triggerDef.function_name);
    
    // Get the correct service details
    const clusterService = await getClusterService(client);
    if (!clusterService) {
      throw new Error('No MongoDB Atlas cluster service found');
    }
    
    // Correct trigger payload structure for MongoDB Atlas API
    const triggerPayload = {
      name: triggerDef.name,
      type: "DATABASE",
      disabled: false,
      function_id: functionId,
      config: {
        operation_types: triggerDef.config.operation_types || ["INSERT", "UPDATE", "DELETE", "REPLACE"],
        database: triggerDef.config.database || "test",
        collection: triggerDef.config.collection || "test1",
        service_id: clusterService._id,
        match: triggerDef.config.match || {},
        full_document: triggerDef.config.full_document !== false,
        full_document_before_change: triggerDef.config.full_document_before_change !== false,
        unordered: false
      }
    };
    
    console.log('🔍 Trigger payload:', JSON.stringify(triggerPayload, null, 2));
    
    const response = await client.post(
      `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/triggers`,
      triggerPayload
    );
    
    console.log(`✅ Successfully created trigger: ${triggerDef.name} (ID: ${response.data._id})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating trigger ${triggerDef.name}:`, error.response?.data || error.message);
    throw error;
  }
}

// Alternative: Try creating trigger with legacy format
async function createTriggerAlternative(client, triggerDef) {
  try {
    console.log(`📝 Alternative approach for trigger: ${triggerDef.name}`);
    
    // Get the function ID by name
    const functionId = await getFunctionIdByName(client, triggerDef.function_name);
    
    // Get the correct service details
    const clusterService = await getClusterService(client);
    if (!clusterService) {
      throw new Error('No MongoDB Atlas cluster service found');
    }
    
    // Try with event_processors structure (legacy format)
    const triggerPayload = {
      name: triggerDef.name,
      type: "DATABASE",
      disabled: false,
      event_processors: {
        FUNCTION: {
          config: {
            function_id: functionId
          }
        }
      },
      config: {
        operation_types: triggerDef.config.operation_types || ["INSERT", "UPDATE", "DELETE", "REPLACE"],
        database: triggerDef.config.database || "test",
        collection: triggerDef.config.collection || "test1",
        service_id: clusterService._id,
        match: triggerDef.config.match || {},
        full_document: triggerDef.config.full_document !== false,
        full_document_before_change: triggerDef.config.full_document_before_change !== false
      }
    };
    
    console.log('🔍 Alternative trigger payload:', JSON.stringify(triggerPayload, null, 2));
    
    const response = await client.post(
      `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/triggers`,
      triggerPayload
    );
    
    console.log(`✅ Successfully created trigger: ${triggerDef.name} (ID: ${response.data._id})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Alternative approach also failed for ${triggerDef.name}:`, error.response?.data || error.message);
    throw error;
  }
}

// Main function to set up triggers
async function setupTriggers() {
  console.log('🚀 Starting MongoDB Atlas Triggers setup...\n');
  
  validateConfig();
  const client = await createAtlasClient();
  const triggerDefinitions = readTriggerDefinitions();
  
  console.log(`📋 Found ${triggerDefinitions.length} trigger definitions\n`);
  
  const results = {
    created: [],
    errors: []
  };
    for (const triggerDef of triggerDefinitions) {
    try {
      let newTrigger;
      try {
        // Try primary approach first
        newTrigger = await createTrigger(client, triggerDef);
      } catch (primaryError) {
        console.log(`⚠️  Primary approach failed, trying alternative...`);
        // If primary fails, try alternative approach
        newTrigger = await createTriggerAlternative(client, triggerDef);
      }
      
      results.created.push(newTrigger);
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.errors.push({
        triggerName: triggerDef.name,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n📊 Setup Summary:');
  console.log(`✅ Created: ${results.created.length} triggers`);
  console.log(`❌ Errors: ${results.errors.length} triggers`);
  
  if (results.created.length > 0) {
    console.log('\n🆕 Created Triggers:');
    results.created.forEach(trigger => console.log(`  - ${trigger.name} (${trigger._id})`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error.triggerName}: ${error.error}`));
  }
  
  console.log('\n🎉 Triggers setup completed!');
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTriggers().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  setupTriggers,
  createTrigger,
  readTriggerDefinitions,
  getClusterService
};