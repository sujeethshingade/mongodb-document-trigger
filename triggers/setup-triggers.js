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

// Validate config and create authenticated client
async function createAtlasClient() {
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
    });

    console.log('Authentication successful');
    return axios.create({
      baseURL: CONFIG.ATLAS_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResponse.data.access_token}`
      }
    });
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw new Error('Atlas authentication failed');
  }
}

// Get function ID and service ID
async function getTriggerRequirements(client, functionName) {
  const [functionsResponse, servicesResponse] = await Promise.all([
    client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/functions`),
    client.get(`/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/services`)
  ]);

  const targetFunction = functionsResponse.data.find(func => func.name === functionName);
  const clusterService = servicesResponse.data.find(service => service.type === 'mongodb-atlas');

  if (!targetFunction) throw new Error(`Function '${functionName}' not found`);
  if (!clusterService) throw new Error('No MongoDB Atlas cluster service found');

  console.log(`Found function: ${functionName} (${targetFunction._id})`);
  console.log(`Found cluster service: ${clusterService.name} (${clusterService._id})`);

  return { 
    functionId: targetFunction._id, 
    serviceId: clusterService._id, 
    serviceName: clusterService.name 
  };
}

// Create Trigger with multiple approach fallbacks
async function createTrigger(client, triggerDef) {
  console.log(`Creating trigger: ${triggerDef.name}`);
  
  const { functionId, serviceId, serviceName } = await getTriggerRequirements(client, triggerDef.function_name);
  
  const baseConfig = {
    operation_types: triggerDef.config?.operation_types || ["INSERT", "UPDATE", "DELETE", "REPLACE"],
    database: triggerDef.config?.database || triggerDef.database,
    collection: triggerDef.config?.collection || triggerDef.collection,
    match: triggerDef.config?.match || triggerDef.match || {},
    full_document: triggerDef.config?.full_document !== false,
    full_document_before_change: triggerDef.config?.full_document_before_change !== false
  };

  const approaches = [
    // Modern format with function_id
    {
      name: triggerDef.name,
      type: "DATABASE",
      disabled: false,
      function_id: functionId,
      config: { ...baseConfig, service_id: serviceId }
    },
    // Legacy format with event_processors
    {
      name: triggerDef.name,
      type: "DATABASE", 
      disabled: false,
      event_processors: { FUNCTION: { config: { function_id: functionId } } },
      config: { ...baseConfig, service_id: serviceId }
    },
    // Alternative with service_name
    {
      name: triggerDef.name,
      type: "DATABASE",
      disabled: false,
      function_id: functionId,
      config: { ...baseConfig, service_name: serviceName }
    },
    // Minimal configuration
    {
      name: triggerDef.name,
      type: "DATABASE",
      disabled: false,
      function_id: functionId,
      config: { ...baseConfig }
    }
  ];

  for (let i = 0; i < approaches.length; i++) {
    try {
      const response = await client.post(
        `/groups/${CONFIG.ATLAS_PROJECT_ID}/apps/${CONFIG.ATLAS_APP_ID}/triggers`,
        approaches[i]
      );
      console.log(`Successfully created trigger: ${triggerDef.name} (${response.data._id})`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      
      if (errorMsg.includes('shared tier') || errorMsg.includes('changestreams')) {
        console.error('Database triggers not supported on shared tier clusters');
        console.error('Consider upgrading to M10+ cluster or using scheduled triggers');
        throw new Error('Database triggers not supported on shared tier clusters');
      }
      
      if (i < approaches.length - 1) {
        console.log(`Approach ${i + 1} failed, trying next approach`);
      } else {
        console.error(`All approaches failed for ${triggerDef.name}:`, errorMsg);
        throw error;
      }
    }
  }
}

// Main Setup function
async function setupTriggers() {
  console.log('Starting Triggers setup\n');

  const client = await createAtlasClient();
  
  const triggersPath = path.join(__dirname, 'triggers.json');
  const triggerDefinitions = JSON.parse(fs.readFileSync(triggersPath, 'utf8'));
  console.log(`Found ${triggerDefinitions.length} trigger definitions\n`);
  
  const results = { created: [], errors: [] };
  
  for (const triggerDef of triggerDefinitions) {
    try {
      const newTrigger = await createTrigger(client, triggerDef);
      results.created.push(newTrigger);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.errors.push({ triggerName: triggerDef.name, error: error.message });
    }
  }
  
  console.log('\nSetup Summary:');
  console.log(`Created: ${results.created.length} triggers`);
  console.log(`Errors: ${results.errors.length} triggers`);
  
  if (results.created.length > 0) {
    console.log('\nCreated Triggers:');
    results.created.forEach(trigger => console.log(`  - ${trigger.name} (${trigger._id})`));
  }
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => console.log(`  - ${error.triggerName}: ${error.error}`));
  }
  
  console.log('\nTriggers setup completed');
}

if (require.main === module) {
  setupTriggers().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { setupTriggers, createTrigger };