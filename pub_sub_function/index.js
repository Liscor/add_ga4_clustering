const functions = require('@google-cloud/functions-framework');
const {BigQuery} = require('@google-cloud/bigquery');


/**
 * Moritz Bauer
 * Updates the GA4 raw events tables and reprocesses the rows to the specified clusters.
 * @param {string} cluster_by - Defines the GA4 columns the data should be clustered by. Seperated by comma exp.: "stream_id,event_name"
 * */

functions.cloudEvent('update_ga4_tables',async cloudEvent => {
    const cluster_by = "stream_id";

    const base64name = cloudEvent.data.message.data;

    const pub_sub_message = base64name
      ? Buffer.from(base64name, 'base64').toString()
      : 'empty';
    
    if(JSON.parse(pub_sub_message).protoPayload.resourceName){
        console.log(JSON.parse(pub_sub_message).protoPayload.resourceName);
        const resource_name = JSON.parse(pub_sub_message).protoPayload.resourceName;
        
        const ga4 = {
            project_id: resource_name.split("/")[1],
            dataset_id: resource_name.split("/")[3],
            table_id: resource_name.split("/")[5]
        }

        console.log(ga4);
        
        const bigquery = new BigQuery({
            projectId: ga4.project_id
        });

        const ga4_options = {
            clustering: {
                fields: [cluster_by],
            },
        };
            
        try{
            await bigquery.dataset(ga4.dataset_id).table(ga4.table_id).setMetadata(ga4_options);
            console.log(`Table ${ga4.table_id} updated and clustered by: ${cluster_by}.`);

            const query_update_cluster_rows = `
                UPDATE \`${ga4.dataset_id}.${ga4.table_id}\`
                SET stream_id = stream_id
                WHERE true
            `;
        
            const [job] = await bigquery.createQueryJob({query:query_update_cluster_rows});
            console.log(`Job ${job.id} started.`);

            // Wait for the query to finish
            await job.getQueryResults();
            console.log(`Reprocess for ${ga4.table_id} was successful`);
        }catch(error){
            console.log(error.message);
        }
    }
    else {
        console.log("protoPayload.resourceName not found.");
    } 
});