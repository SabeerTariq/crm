# Chargeback & Refunds Management Module

## Overview
The Chargeback & Refunds Management module provides comprehensive functionality to handle customer chargebacks, refunds, and retained customers. This module allows administrators to track and manage financial adjustments that impact customer cash-in amounts and upseller performance metrics.

## Features

### 1. Three Main Categories
- **Chargebacks**: When customers dispute charges and request refunds
- **Refunds**: When customers are issued refunds (full or partial)
- **Retained Customers**: Customers who were retained after dispute resolution

### 2. Key Functionality
- Create new chargeback/refund records
- Update record status (pending, approved, rejected, processed)
- Edit record details including amounts and reasons
- Delete records (with automatic restoration of original values)
- View comprehensive audit logs
- Real-time statistics dashboard

### 3. Financial Impact
- Automatically adjusts customer cash-in amounts
- Updates upseller performance metrics
- Maintains customer status tracking
- Provides detailed financial reporting

## Database Schema

### Main Tables

#### `chargeback_refunds`
```sql
- id (INT, PRIMARY KEY)
- customer_id (INT, FOREIGN KEY to customers)
- sale_id (INT, FOREIGN KEY to sales)
- type (ENUM: 'chargeback', 'refund', 'retained')
- amount (DECIMAL(12,2))
- original_amount (DECIMAL(12,2))
- refund_type (ENUM: 'full', 'partial')
- reason (TEXT)
- status (ENUM: 'pending', 'approved', 'rejected', 'processed')
- processed_by (INT, FOREIGN KEY to users)
- processed_at (TIMESTAMP)
- created_by (INT, FOREIGN KEY to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `chargeback_refund_audit`
```sql
- id (INT, PRIMARY KEY)
- chargeback_refund_id (INT, FOREIGN KEY)
- action (ENUM: 'created', 'updated', 'status_changed', 'processed')
- old_values (JSON)
- new_values (JSON)
- performed_by (INT, FOREIGN KEY to users)
- performed_at (TIMESTAMP)
```

### Schema Updates
- Added `customer_status` field to `customers` table
- Added `chargeback_refund_id` field to `payment_transactions` table

## API Endpoints

### GET `/api/chargeback-refunds`
- **Purpose**: Retrieve all chargeback/refund records
- **Parameters**: 
  - `type`: Filter by type (chargeback, refund, retained)
  - `status`: Filter by status
  - `page`: Page number for pagination
  - `limit`: Records per page
- **Response**: Paginated list of records with customer and sale details

### GET `/api/chargeback-refunds/:id`
- **Purpose**: Get specific record details
- **Response**: Complete record information including customer and sale data

### POST `/api/chargeback-refunds`
- **Purpose**: Create new chargeback/refund record
- **Body**:
  ```json
  {
    "customer_id": 123,
    "sale_id": 456,
    "type": "chargeback",
    "amount": 1000.00,
    "refund_type": "full",
    "reason": "Customer dispute"
  }
  ```
- **Effects**: 
  - Updates customer status
  - Adjusts sales cash_in amount
  - Updates upseller performance metrics

### PATCH `/api/chargeback-refunds/:id/status`
- **Purpose**: Update record status
- **Body**: `{"status": "approved"}`

### PUT `/api/chargeback-refunds/:id`
- **Purpose**: Update record details
- **Body**: Updated record fields

### DELETE `/api/chargeback-refunds/:id`
- **Purpose**: Delete record
- **Effects**: 
  - Restores original sales cash_in amount
  - Restores upseller performance metrics
  - Resets customer status to active

### GET `/api/chargeback-refunds/:id/audit`
- **Purpose**: Get audit log for specific record

### GET `/api/chargeback-refunds/stats/summary`
- **Purpose**: Get summary statistics
- **Response**: Counts and totals by type and status

## Frontend Components

### Main Component: `ChargebackRefunds.js`
- **Location**: `client/src/pages/ChargebackRefunds.js`
- **Features**:
  - Tabbed interface for different record types
  - Statistics dashboard with visual cards
  - Data table with pagination
  - Modal forms for creating/editing records
  - Status management buttons
  - Responsive design

### Styling: `ChargebackRefunds.css`
- **Location**: `client/src/pages/ChargebackRefunds.css`
- **Features**:
  - Modern card-based layout
  - Color-coded status badges
  - Responsive grid system
  - Interactive hover effects
  - Mobile-friendly design

## Permissions

### Required Permissions
- `chargeback_refunds.view`: View records
- `chargeback_refunds.create`: Create new records
- `chargeback_refunds.update`: Update existing records
- `chargeback_refunds.delete`: Delete records

### Default Assignment
- All permissions are assigned to the `admin` role by default

## Navigation

### Sidebar Integration
- Added to main navigation menu
- Icon: `fas fa-exclamation-triangle`
- Label: "Chargebacks & Refunds"
- Route: `/chargeback-refunds`

### Route Protection
- Protected by `ProtectedRoute` component
- Requires `chargeback_refunds` module permission

## Business Logic

### Financial Calculations
1. **Chargeback Creation**:
   - Reduces sales `cash_in` by chargeback amount
   - Reduces upseller `revenue_generated` metric
   - Sets customer status to 'chargeback'

2. **Refund Processing**:
   - Reduces sales `cash_in` by refund amount
   - Reduces upseller `revenue_generated` metric
   - Sets customer status to 'refunded'

3. **Retained Customer**:
   - No financial impact
   - Sets customer status to 'retained'

4. **Record Deletion**:
   - Restores original sales `cash_in` amount
   - Restores upseller `revenue_generated` metric
   - Resets customer status to 'active'

### Audit Trail
- All actions are logged in `chargeback_refund_audit` table
- Tracks old and new values for updates
- Records who performed each action and when

## Usage Instructions

### Creating a New Record
1. Navigate to Chargebacks & Refunds page
2. Select appropriate tab (Chargebacks, Refunds, or Retained)
3. Click "Add New [Type]" button
4. Fill in required information:
   - Select customer from dropdown
   - Select associated sale
   - Enter amount
   - Choose refund type (for refunds)
   - Add reason/notes
5. Click "Create" to save

### Managing Record Status
1. Find record in the table
2. Use action buttons:
   - **Edit**: Modify record details
   - **Approve**: Change status to approved
   - **Reject**: Change status to rejected
   - **Delete**: Remove record (with restoration)

### Viewing Statistics
- Dashboard cards show real-time counts and amounts
- Statistics update automatically when records are modified
- Separate totals for each type and overall totals

## Technical Implementation

### Backend Architecture
- **Route Handler**: `server/routes/chargebackRefunds.js`
- **Database**: MySQL with proper foreign key constraints
- **Transactions**: All operations use database transactions for consistency
- **Error Handling**: Comprehensive error handling with rollback support

### Frontend Architecture
- **React Component**: Functional component with hooks
- **State Management**: Local state with useState and useEffect
- **API Integration**: Axios-based API calls
- **Responsive Design**: Mobile-first CSS Grid and Flexbox

### Security
- **Authentication**: JWT token-based authentication required
- **Authorization**: Role-based permission system
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries

## Future Enhancements

### Potential Improvements
1. **Email Notifications**: Notify stakeholders of status changes
2. **Bulk Operations**: Process multiple records simultaneously
3. **Advanced Reporting**: Detailed financial reports and analytics
4. **Integration**: Connect with payment processors for automatic updates
5. **Workflow Management**: Multi-step approval processes
6. **Document Upload**: Attach supporting documents to records

### Performance Optimizations
1. **Caching**: Implement Redis caching for frequently accessed data
2. **Pagination**: Optimize large dataset handling
3. **Search**: Add advanced search and filtering capabilities
4. **Export**: CSV/Excel export functionality

## Troubleshooting

### Common Issues
1. **Permission Errors**: Ensure user has appropriate role permissions
2. **Database Constraints**: Check foreign key relationships
3. **Financial Discrepancies**: Verify upseller performance calculations
4. **Status Updates**: Confirm proper status transition logic

### Debug Information
- Check browser console for frontend errors
- Review server logs for backend issues
- Verify database constraints and relationships
- Test API endpoints independently

## Conclusion

The Chargeback & Refunds Management module provides a comprehensive solution for handling customer disputes and financial adjustments. It maintains data integrity through proper database transactions, provides detailed audit trails, and integrates seamlessly with existing CRM functionality. The module is designed to be scalable, maintainable, and user-friendly while ensuring accurate financial tracking and reporting.
