# Cloud Function - Add Clustering to GA4 raw data tables in BigQuery

This package contains two different cloud functions to cluster GA4 raw data tables.
1. HTTP-based: Used to cluster historical GA4 data tables on demand
2. Pub/Sub-based: Used to automatically cluster GA4 raw data tables when they are getting created

## Quickstart
To deploy the function to your GCP project you can do the following:
1. Download / clone the repository
2. Authenticate with GCP using the Application Default Credentials
3. Check for the currently active GCP project with ```gcloud config get-value project``` and change it with ```gcloud config set project_id YOUR_PROJECT_ID```
4. Optional: Change the region for the deployment in the cloudbuild.yaml or / and add a service account if needed
5. Deploy the cloud function with ```gcloud builds submit```

## Http-based
Uses a post body with the following parameters:
```javascript
 {   
    "cluster_by":"event_name",
    "project_id": "moritz-test-projekt",
    "dataset_id":"analytics_262445815_Copy",
    "start_date": "2024-01-01",
    "end_date":"2024-02-14"
} 
```

## Pub/Sub-based
This function takes the parameters from the incoming Pub/Sub message from the ``protoPayload.resourceName`` field. You need to set up a log sink with a Pub/Sub topic to use this function correctly. To set the fields to cluster by you need to set the ``cluster_by`` variable in index.js.
### Automation
To run this everytime when a new GA4 table is beeing createdmMake sure to use this query for the log sink. This will usually trigger the Cloud Function once per day, when Google pushes new GA4 data to BigQuery.
```sql
    proto_payload.resource_name=~"projects/YOUR_PROJECT_ID/datasets/GA4_DATASET_ID/tables/events_2"
    proto_payload.authorization_info.permission="bigquery.tables.create"
```
The standard name for the Pub/Sub topic triggering the Cloud Function is ``ga4_table_created``. You can adjust this in the cloudbuild.yaml inside the pub_sub_function folder. 