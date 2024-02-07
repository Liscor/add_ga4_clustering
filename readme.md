# Cloud Function - Add Clustering to GA4 raw data tables in BigQuery

This cloud function can change the clustering in historical Tables for GA4 to apply clustering. Triggering is done with an http reqeuest
which contains a post body in following format:
```javascript
 {   
    "cluster_by":"stream_id",
    "project_id": "moritz-test-projekt",
    "dataset_id":"analytics_262445815_Copy",
    "start_date": "2024-01-01",
    "end_date":"2024-01-04"
} 
```
## Quickstart
To deploy the function to your GCP project you can do the following:
1. Download / clone the repository
2. Authenticate with GCP using the Application Default Credentials
3. Check for the currently active GCP project with ```gcloud config get-value project``` and change it with ```gcloud config set project_id YOUR_PROJECT_ID```
4. Optional: Change the region for the deployment in the cloudbuild.yaml or / and add a service account if needed
5. Deploy the cloud function with ```gcloud builds submit```

## Automation
To run this everytime when a new GA4 table is beeing created you can you use a log filter in connection with Pub/Sub.
```sql
    proto_payload.resource_name=~"projects/YOUR_PROJECT_ID/datasets/GA4_DATASET_ID/tables/events_2"
    proto_payload.authorization_info.permission="bigquery.tables.create"
```