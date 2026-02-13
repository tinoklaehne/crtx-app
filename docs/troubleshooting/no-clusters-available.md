# No Clusters Available Error in New Trend Modal

## Issue Description
When creating a new trend and selecting a domain (Technology, Social, or Business), the cluster dropdown shows "No clusters available" even though clusters exist in the system.

## Root Cause Analysis
The issue occurs due to:
1. Domain mismatch between clusters and selected domain in the form
2. Case sensitivity in domain comparison
3. Incorrect filtering of available clusters based on domain

## Steps to Reproduce
1. Click the "+" button in the General Trends section
2. In the "Create New Trend" modal:
   - Select any domain (Technology, Social, or Business)
   - Observe the Cluster dropdown shows "No clusters available"

## Expected Behavior
- When selecting a domain, all clusters belonging to that domain should be available in the dropdown
- Clusters should be filtered based on the selected domain
- The dropdown should be populated with relevant clusters

## Current Behavior
- Cluster dropdown shows "No clusters available" for all domain selections
- Available clusters are not being properly filtered by domain
- Domain-based filtering is not working as expected

## Technical Investigation
1. Check Airtable data:
   - Verify clusters have correct domain values
   - Ensure domain values match exactly ("technology", "social", "business")
   - Confirm cluster data is being properly loaded

2. Review form state:
   - Monitor domain selection changes
   - Verify cluster filtering logic
   - Check domain comparison implementation

3. Data flow:
   - Confirm clusters prop is being passed correctly
   - Verify domain values are consistent throughout the application
   - Check filter implementation in the form component

## Solution Steps
1. Update cluster filtering logic:
```typescript
const availableClusters = clusters.filter(c => 
  c.domain.toLowerCase() === form.domain.toLowerCase()
);
```

2. Ensure domain values are normalized:
```typescript
const domain = selectedDomain.toLowerCase() as Domain;
```

3. Add proper type checking:
```typescript
type Domain = "technology" | "social" | "business";
```

4. Implement error handling:
```typescript
if (availableClusters.length === 0) {
  console.warn(`No clusters found for domain: ${form.domain}`);
}
```

## Prevention
1. Add domain validation in cluster creation
2. Implement proper error messages for users
3. Add data integrity checks for domain values
4. Create automated tests for domain-cluster relationships

## Additional Notes
- Domain values are case-sensitive in Airtable
- Cluster availability depends on proper domain assignment
- Form validation should prevent submission without cluster selection