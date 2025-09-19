# Page Layout Standardization Guide

## Overview
This guide shows how to update all pages to use the new `PageLayout` component for consistent layout and proper margin handling.

## Changes Made
1. ✅ Updated all `marginLeft: '200px'` to `marginLeft: '285px'` in all pages
2. ✅ Created `PageLayout` component for consistent layout
3. ✅ Updated `Teams.js` and `Dashboard.js` as examples

## Pattern for Updating Each Page

### Step 1: Update Imports
Replace:
```javascript
import Sidebar from '../components/Sidebar';
```
With:
```javascript
import PageLayout from '../components/PageLayout';
```

### Step 2: Update Loading States
Replace:
```javascript
if (loading) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '285px', padding: '20px', width: '100%' }}>
        <div>Loading...</div>
      </div>
    </div>
  );
}
```
With:
```javascript
if (loading) {
  return (
    <PageLayout>
      <div>Loading...</div>
    </PageLayout>
  );
}
```

### Step 3: Update Main Return Statement
Replace:
```javascript
return (
  <div style={{ display: 'flex' }}>
    <Sidebar />
    <div style={{ marginLeft: '285px', padding: '20px', width: '100%' }}>
      {/* page content */}
    </div>
  </div>
);
```
With:
```javascript
return (
  <PageLayout>
    {/* page content */}
  </PageLayout>
);
```

## Pages to Update
- [x] Teams.js
- [x] Dashboard.js
- [ ] Leads.js
- [ ] LeadScraperDashboard.js
- [ ] UpsellerDashboard.js
- [ ] FrontSellerDashboard.js
- [ ] Sales.js
- [ ] Payments.js
- [ ] UpsellerTargets.js
- [ ] CustomerSalesProfile.js
- [ ] Targets.js
- [ ] UpsellerTeams.js
- [ ] UpsellerPerformance.js
- [ ] Assignments.js
- [ ] Customers.js
- [ ] Performance.js

## Benefits
1. **Consistent Layout**: All pages use the same layout structure
2. **Easier Maintenance**: Changes to layout only need to be made in one place
3. **Responsive Design**: PageLayout handles responsive behavior automatically
4. **Cleaner Code**: Removes repetitive layout code from each page
5. **Future-Proof**: Easy to add new layout features globally

## PageLayout Component Features
- Automatic sidebar inclusion
- Proper margin handling (285px for expanded, 70px for collapsed)
- Responsive design support
- Consistent padding and styling
- Easy to extend with additional props
