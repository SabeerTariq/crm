# CRM Payment System Documentation

## Overview
The CRM system includes a comprehensive payment management system that handles multiple types of payments for customers. The system supports installment payments, recurring payments, and tracks all payment transactions.

## Database Structure

### Core Tables

#### 1. `sales` Table
- **Purpose**: Stores sales transactions and basic payment information
- **Key Fields**:
  - `id`: Primary key
  - `customer_id`: Foreign key to customers table
  - `unit_price`: Total sale amount
  - `cash_in`: Amount already paid
  - `remaining`: Amount still owed (calculated as unit_price - cash_in)
  - `payment_type`: Enum ('one_time', 'recurring', 'installments')
  - `payment_source`: Payment platform (wire, cashapp, stripe, etc.)
  - `services`: JSON string of services provided

#### 2. `payment_installments` Table
- **Purpose**: Manages installment-based payments
- **Key Fields**:
  - `id`: Primary key
  - `sale_id`: Foreign key to sales table
  - `installment_number`: Sequential installment number
  - `amount`: Amount for this installment
  - `due_date`: When payment is due
  - `paid_amount`: Amount already paid for this installment
  - `status`: Enum ('pending', 'paid', 'overdue')
  - `paid_at`: Timestamp when fully paid

#### 3. `payment_recurring` Table
- **Purpose**: Manages recurring subscription payments
- **Key Fields**:
  - `id`: Primary key
  - `sale_id`: Foreign key to sales table
  - `customer_id`: Foreign key to customers table
  - `amount`: Amount per recurring payment
  - `frequency`: Enum ('weekly', 'monthly', 'quarterly', 'yearly')
  - `next_payment_date`: When next payment is due
  - `last_payment_date`: When last payment was made
  - `status`: Enum ('active', 'paused', 'cancelled', 'completed')
  - `total_payments`: Total number of payments (NULL for indefinite)
  - `payments_made`: Number of payments completed

#### 4. `payment_transactions` Table
- **Purpose**: Records all payment transactions
- **Key Fields**:
  - `id`: Primary key
  - `sale_id`: Foreign key to sales table
  - `installment_id`: Foreign key to payment_installments (if applicable)
  - `recurring_id`: Foreign key to payment_recurring (if applicable)
  - `amount`: Transaction amount
  - `payment_method`: How payment was made (cash, card, etc.)
  - `payment_source`: Platform used (wire, stripe, etc.)
  - `transaction_reference`: External transaction ID
  - `created_by`: User who processed the payment

#### 5. `upcoming_payments` Table
- **Purpose**: Tracks all upcoming payments across different types
- **Key Fields**:
  - `id`: Primary key
  - `customer_id`: Foreign key to customers table
  - `payment_type`: Enum ('installment', 'subscription', 'invoice')
  - `source_id`: ID of the source record (installment, recurring, or invoice)
  - `amount`: Payment amount
  - `due_date`: When payment is due
  - `status`: Enum ('pending', 'paid', 'overdue')
  - `description`: Human-readable description

## Payment Types

### 1. One-Time Payments
- **Description**: Single payment for a sale
- **Storage**: Only in `sales` table
- **Tracking**: `cash_in` field tracks paid amount

### 2. Installment Payments
- **Description**: Large sales split into multiple payments
- **Storage**: 
  - Main record in `sales` table
  - Individual installments in `payment_installments` table
- **Features**:
  - Configurable frequency (weekly, monthly, quarterly)
  - Automatic due date calculation
  - Partial payment support
  - Overdue tracking

### 3. Recurring Payments
- **Description**: Subscription-based payments
- **Storage**:
  - Main record in `sales` table
  - Recurring schedule in `payment_recurring` table
- **Features**:
  - Multiple frequencies (weekly, monthly, quarterly, yearly)
  - Indefinite or fixed number of payments
  - Automatic next payment date calculation
  - Status management (active, paused, cancelled)

## API Endpoints

### Payment Management Routes (`/api/payments`)

#### GET `/sale/:saleId`
- **Purpose**: Get payment details for a specific sale
- **Returns**: Combined data from sales, installments, and recurring payments
- **Permissions**: `payments:read`

#### POST `/installments`
- **Purpose**: Create installment payments for a sale
- **Body**: `{ saleId, totalAmount, numberOfInstallments, frequency, startDate }`
- **Permissions**: `payments:create`

#### POST `/recurring`
- **Purpose**: Create recurring payment for a sale
- **Body**: `{ saleId, customerId, amount, frequency, startDate, totalPayments }`
- **Permissions**: `payments:create`

#### POST `/installment/:installmentId/pay`
- **Purpose**: Process an installment payment
- **Body**: `{ amount, paymentMethod, paymentSource, notes }`
- **Permissions**: `payments:update`

#### POST `/recurring/:recurringId/pay`
- **Purpose**: Process a recurring payment
- **Body**: `{ amount, paymentMethod, paymentSource, notes }`
- **Permissions**: `payments:update`

#### GET `/upcoming/installments`
- **Purpose**: Get upcoming installment payments
- **Query**: `?days=7` (default 7 days)
- **Permissions**: `payments:read`

#### GET `/upcoming/recurring`
- **Purpose**: Get upcoming recurring payments
- **Query**: `?days=7` (default 7 days)
- **Permissions**: `payments:read`

#### GET `/transactions/:saleId`
- **Purpose**: Get all payment transactions for a sale
- **Permissions**: `payments:read`

## Frontend Components

### Payments Page (`/client/src/pages/Payments.js`)
- **Purpose**: Main payment management interface
- **Features**:
  - View upcoming installments and recurring payments
  - Process payments through modal forms
  - View detailed payment history
  - Status tracking and management

### Key Features:
1. **Upcoming Payments Dashboard**: Shows payments due in the next 30 days
2. **Payment Processing**: Modal forms for processing payments
3. **Payment History**: Detailed view of all transactions
4. **Status Management**: Visual indicators for payment statuses

## Payment Flow

### 1. Sale Creation
1. Sale is created in `sales` table
2. Payment type is determined (one_time, installments, recurring)
3. If installments: `PaymentService.createInstallments()` is called
4. If recurring: `PaymentService.createRecurringPayment()` is called

### 2. Payment Processing
1. Payment is processed through API endpoint
2. `PaymentService.recordPayment()` creates transaction record
3. Relevant installment or recurring record is updated
4. Sale's `cash_in` and `remaining` amounts are updated
5. Status is updated based on payment completion

### 3. Status Updates
- **Installments**: Status changes from 'pending' to 'paid' when fully paid
- **Recurring**: Status remains 'active' until completed or cancelled
- **Overdue**: Automatic detection based on due dates

## Business Logic

### Payment Calculations
- **Remaining Amount**: `unit_price - cash_in`
- **Installment Amount**: `total_amount / number_of_installments`
- **Next Payment Date**: Calculated based on frequency and last payment

### Status Management
- **Pending**: Payment not yet due or not fully paid
- **Paid**: Payment fully completed
- **Overdue**: Payment past due date and not fully paid
- **Active**: Recurring payment is active
- **Paused**: Recurring payment temporarily stopped
- **Cancelled**: Recurring payment permanently stopped
- **Completed**: Recurring payment finished all required payments

## Security & Permissions

### Required Permissions
- `payments:read` - View payment information
- `payments:create` - Create new payment schedules
- `payments:update` - Process payments and update status
- `payments:delete` - Remove payment schedules

### Data Validation
- Amount validation (positive numbers)
- Date validation (future dates for schedules)
- Status validation (enum values only)
- Foreign key constraints

## Integration Points

### With Sales System
- Payments are linked to sales through `sale_id`
- Sale amounts are updated when payments are processed
- Payment type determines which additional tables are used

### With Customer System
- All payments are linked to customers
- Customer information is displayed in payment interfaces
- Payment history is accessible from customer views

### With Finance System
- Payment data feeds into financial reporting
- Cash flow tracking through transaction records
- Revenue recognition based on payment status

## Current Data Sample

Based on the database analysis, the system currently contains:
- **Sales**: 6 records with various payment types
- **Recurring Payments**: 1 active monthly subscription
- **Payment Transactions**: 1 recorded transaction
- **Payment Installments**: Currently empty (no installment data)

## Recommendations

1. **Data Integrity**: Ensure all payment calculations are consistent
2. **Audit Trail**: All payment changes should be logged
3. **Reporting**: Implement comprehensive payment reporting
4. **Notifications**: Add automated payment reminders
5. **Integration**: Consider integrating with external payment processors
