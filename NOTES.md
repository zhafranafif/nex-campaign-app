## DONE
1. Initialize project and setup firebase emulator
2. create firestore rules and firestore rules testing
3. Review Submission and Mark Paid functions with Audit Trail and Unit Testing
4. Implement seeding with scripts
5. Implement Auth Context with Provider for Authentication Feature
6. Install and Setup Tailwind CSS for styling with their styling token
7. Implement Sign In with Authentication
8. Implement Creator and Ops Dashboard with their functionality
9. Implement Import and Export CSV By Ops
10. Implement i18n
11. Write README.md for project documentation

### (a) How would you deploy only your new function, without touching other functions?
I would use one of Firebase feature that support individual Cloud Function Deployment
```bash
firebase deploy --only function:my-function
```
With this strategy, I won't touching other functions

### (b) Where would a TikTok client secret live?
I would store the TikTok Client Secret in the Google Cloud Secret Manager that integrates with Cloud Functions

### (c) What happens if two ops approve the same submission at the same moment in your design? 
I use Firebase Transactions for handle concurrency and maintain data consistency.

If two ops approve the same submission at the same time, the first one will success updating the data and write the auditLogs,
While the other one still expect success response using toast like `the submissions was already approved`. The submission document is not updated again and the auditLogs not written

### (d) Two things you would fix with more time.
- Improve the CSV import workflow. Currently, the import report is kept temporarily in React state and is lost after the page refreshes. I would create an `import-csv` document containing the uploaded    file metadata, actor, timestamp, imported count, rejected count, and row-level errors. Ops users could then view previous import history.
- Improve code splitting and component structure. The `CreatorDashboard` and `OpsDashboard` components currently contain UI, state management, event handlers, and workflow logic in large files. I would split them into smaller components, and custom hooks to improve readability and maintainability.
- Improve rejected reason window prompt to use input modal