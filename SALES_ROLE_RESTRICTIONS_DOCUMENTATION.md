# Sales Module Role-Based Restrictions

## Overview
This document describes the role-based access control implemented in the sales module to ensure that:
- Users with 'sales' role (role_id = 3) can only work with leads
- Users with 'upseller' role (role_id = 5) can only work with customers

## Changes Made

### Backend Changes (server/routes/sales.js)

#### 1. Updated GET /sales/customers endpoint
- **Sales role (role_id = 3)**: Returns 403 Forbidden with message "Sales role can only work with leads, not customers"
- **Upseller role (role_id = 5)**: Returns only assigned customers (existing behavior)
- **Other roles**: Returns all customers (existing behavior)

#### 2. Updated GET /sales/leads endpoint
- **Upseller role (role_id = 5)**: Returns 403 Forbidden with message "Upseller role can only work with customers, not leads"
- **Other roles**: Returns all leads (existing behavior)

#### 3. Updated GET /sales endpoint (main sales listing)
- **Sales role (role_id = 3)**: Shows only sales from leads (customer_id is null or from converted leads)
- **Upseller role (role_id = 5)**: Shows sales for assigned customers only (existing behavior)
- **Admin role (role_id = 1)**: Shows all sales (existing behavior)
- **Other roles**: Shows only their own sales (existing behavior)

### Frontend Changes (client/src/pages/Sales.js)

#### 1. Role Detection
- Added logic to detect user role from localStorage
- Added boolean flags: `canWorkWithLeads` and `canWorkWithCustomers`

#### 2. Form Validation
- **Sales role**: Must select a lead (customer selection not available)
- **Upseller role**: Must select a customer (lead selection not available)
- **Other roles**: Can select either customer or lead

#### 3. UI Updates
- Customer selection field only shown for users who can work with customers
- Lead selection field only shown for users who can work with leads
- Added role-specific help text and validation messages
- Required field indicators based on role

#### 4. Data Loading
- Customers only loaded if `canWorkWithCustomers` is true
- Leads only loaded if `canWorkWithLeads` is true
- Error handling for 403 responses (sets empty arrays)

## Role Definitions

| Role ID | Role Name | Can Work With Leads | Can Work With Customers | Notes |
|---------|-----------|-------------------|------------------------|-------|
| 1 | admin | ✅ | ✅ | Full access to everything |
| 2 | lead-scraper | ✅ | ❌ | Can create leads, not customers |
| 3 | sales | ✅ | ❌ | **Must convert leads to customers** |
| 4 | front-sales-manager | ✅ | ✅ | Can work with both |
| 5 | upseller | ❌ | ✅ | **Must work with assigned customers only** |
| 6 | upseller-manager | ✅ | ✅ | Can work with both |

## API Endpoints Affected

### GET /sales/customers
- **Sales role**: 403 Forbidden
- **Upseller role**: Assigned customers only
- **Other roles**: All customers

### GET /sales/leads
- **Upseller role**: 403 Forbidden
- **Other roles**: All leads

### GET /sales
- **Sales role**: Sales from leads only
- **Upseller role**: Sales for assigned customers only
- **Admin role**: All sales
- **Other roles**: Own sales only

## Testing

A test script `test_sales_role_restrictions.js` has been created to verify the restrictions work correctly. The test checks:

1. Sales role cannot access customers endpoint
2. Sales role can access leads endpoint
3. Upseller role cannot access leads endpoint
4. Upseller role can access customers endpoint
5. Admin role can access both endpoints

## Security Considerations

- All restrictions are enforced on the backend
- Frontend restrictions are for UX only and can be bypassed
- Role validation happens at the API level
- Error messages are informative but don't expose sensitive information

## Database Requirements

The implementation assumes the following database structure:
- `users` table with `role_id` column
- `roles` table with role definitions
- `customer_assignments` table for upseller-customer relationships
- `customers` table with `converted_at` column to track lead conversions
