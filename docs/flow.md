# FormMate AI Flow Diagram

```mermaid
graph TD
    A[User Logs into Dashboard] --> B[Manages Knowledge Bank]
    B --> C[Opens a Google Form in Browser]
    C --> D[Chrome Extension Extracts Questions + IDs]
    D --> E[Sends to Flask API]
    E --> F[Backend Matches with Firebase Q&A]
    F --> G[AI Generates Unknown Answers (Optional)]
    G --> H[Sends Final Answers to Extension]
    H --> I[Autofills Form in Browser]
    I --> J[User Clicks Submit]
    J --> K[Submission Logged to History]
``` 