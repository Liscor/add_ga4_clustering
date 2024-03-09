const functions = require('@google-cloud/functions-framework');
const {BigQuery} = require('@google-cloud/bigquery');


/**
 * Moritz Bauer
 * Updates the GA4 raw events tables and reprocesses the rows to the specified clusters.
 * @param {string} req.body.cluster_by - The columns the table should be clustered by
 * @param {string} req.body.project_id - The GCP project where the table is located
 * @param {string} req.body.dataset_id - The dataset_id where the GA4 event tables are located in
 * @param {string} req.body.start_date - The date which is used to determine the first GA4 table to be clustered
 * @param {string} req.body.end_date - The date which is used to determine the last table to be clustered
 * */

functions.http('update_ga4_tables',async (req, res) => {
    if(req.body.cluster_by && req.body.project_id && req.body.dataset_id && req.body.start_date && req.body.end_date){
        let params = {
            ...req.body
        }
        console.log(params)

        const bigquery = new BigQuery({
            projectId: params.project_id
        });
    
        const startDate = new Date(params.start_date); 
        const endDate = new Date(params.end_date); 

        let cluster_by_array = params.cluster_by.split(",");
        let cluster_by_update = "";
        
        cluster_by_array.forEach(element => {
            cluster_by_update += `${element} = ${element},`
        });

        cluster_by_update = cluster_by_update.replace(/,$/, '');

        const ga4_dataset_id = params.dataset_id;
        const ga4_table_id = 'events_';
        const ga4_options = {
            clustering: {
                fields: [cluster_by_array],
            },
        };

        function addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }

        // Change clustering for all GA4 events_ tables for the date range specified in the request body
        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
            try{
                const table_suffix = currentDate.toISOString().split('T')[0].replaceAll("-","");
                await bigquery.dataset(ga4_dataset_id).table(ga4_table_id+table_suffix).setMetadata(ga4_options);
                console.log(`Table ${ga4_table_id} updated and clustered by: ${params.cluster_by}.`);

                const query_update_cluster_rows = `
                    UPDATE \`${ga4_dataset_id}.${ga4_table_id}${table_suffix}\`
                    SET ${cluster_by_update}
                    WHERE true
                `;
            
                const [job] = await bigquery.createQueryJob({query:query_update_cluster_rows});
                console.log(`Job ${job.id} started.`);
            
                await job.getQueryResults();
                console.log(`Reprocess for ${ga4_table_id}${table_suffix} was successful`);
            }catch(error){
                console.log(error.message);
            }
        }
        res.status(200).send(`Table ${ga4_table_id} updated successfully.`);
    }
    else {
        res.status(500).json({"success":"false","message":"Wrong / Missing request body"});
    }
});