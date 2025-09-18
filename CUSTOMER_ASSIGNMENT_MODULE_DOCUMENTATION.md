# Customer Assignment Module Documentation

## 🎯 **Overview**

The Customer Assignment Module enables the assignment of customers to users with the `upseller` role, allowing them to manage sales, payments, and customer relationships for their assigned customers only. This creates a structured approach to customer management and upselling opportunities.

## 🏗️ **Architecture**

### **Database Structure**

#### `customer_assignments` Table
```sql
CREATE TABLE customer_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    upseller_id INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_type ENUM('territory', 'product', 'manual', 'performance') DEFAULT 'manual',
    status ENUM('active', 'inactive', 'transferred') DEFAULT 'active',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (upseller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_active_customer (customer_id, status)
);
```

### **Service Layer**
- **`CustomerAssignmentService`** - Core assignment management logic
- **`checkCustomerAssignment`** - Middleware for access control

### **API Routes**
- **`/api/assignments`** - Complete assignment management endpoints

## 🔧 **Key Features**

### **1. Customer Assignment Management**
- ✅ Assign customers to upsellers
- ✅ Transfer customers between upsellers
- ✅ Deactivate/reactivate assignments
- ✅ Track assignment history

### **2. Access Control**
- ✅ Upsellers can only access assigned customers
- ✅ Payment processing restricted to assigned customers
- ✅ Sales creation limited to assigned customers
- ✅ Automatic permission checking via middleware

### **3. Assignment Types**
- **`territory`** - Geographic-based assignment
- **`product`** - Product expertise-based assignment
- **`manual`** - Manual assignment by admin
- **`performance`** - Performance-based assignment

### **4. Status Management**
- **`active`** - Currently assigned and accessible
- **`inactive`** - Assignment deactivated
- **`transferred`** - Customer transferred to another upseller

## 📡 **API Endpoints**

### **Assignment Management**

#### `GET /api/assignments`
- **Purpose**: Get all assignments (admin only)
- **Query Parameters**: `status`, `assignment_type`, `upseller_id`, `customer_id`, `limit`
- **Permissions**: `assignments:read`

#### `GET /api/assignments/my-assignments`
- **Purpose**: Get assignments for current upseller
- **Query Parameters**: `status` (default: 'active')
- **Permissions**: `assignments:read`
- **Role**: Upseller only

#### `GET /api/assignments/upseller/:upsellerId`
- **Purpose**: Get customers assigned to specific upseller
- **Permissions**: `assignments:read`

#### `GET /api/assignments/customer/:customerId`
- **Purpose**: Get upsellers assigned to specific customer
- **Permissions**: `assignments:read`

### **Assignment Operations**

#### `POST /api/assignments/assign`
- **Purpose**: Assign customer to upseller
- **Body**: `{ customer_id, upseller_id, assignment_type, notes }`
- **Permissions**: `assignments:create`

#### `POST /api/assignments/transfer`
- **Purpose**: Transfer customer to different upseller
- **Body**: `{ customer_id, new_upseller_id, notes }`
- **Permissions**: `assignments:update`

#### `PUT /api/assignments/:assignmentId/status`
- **Purpose**: Update assignment status
- **Body**: `{ status, notes }`
- **Permissions**: `assignments:update`

### **Reporting & Analytics**

#### `GET /api/assignments/upseller/:upsellerId/stats`
- **Purpose**: Get upseller statistics
- **Returns**: Customer counts, sales totals, payment totals
- **Permissions**: `assignments:read`

#### `GET /api/assignments/my-stats`
- **Purpose**: Get statistics for current upseller
- **Role**: Upseller only
- **Permissions**: `assignments:read`

#### `GET /api/assignments/upsellers`
- **Purpose**: Get list of all upsellers with assignment counts
- **Permissions**: `assignments:read`

#### `GET /api/assignments/unassigned-customers`
- **Purpose**: Get customers not assigned to any upseller
- **Permissions**: `assignments:read`

### **Access Control**

#### `GET /api/assignments/check/:customerId`
- **Purpose**: Check if customer is assigned to current upseller
- **Role**: Upseller only
- **Permissions**: `assignments:read`

## 🔐 **Security & Permissions**

### **Role-Based Access Control**
- **Admin**: Full access to all assignments
- **Upseller**: Access only to assigned customers
- **Other Roles**: No access to assignment module

### **Permission Matrix**
| Permission | Admin | Upseller | Other |
|------------|-------|----------|-------|
| `assignments:create` | ✅ | ❌ | ❌ |
| `assignments:read` | ✅ | ✅ | ❌ |
| `assignments:update` | ✅ | ❌ | ❌ |
| `assignments:delete` | ✅ | ❌ | ❌ |
| `assignments:view` | ✅ | ✅ | ❌ |

### **Middleware Protection**
- **`checkCustomerAssignment`** - Automatically applied to payment routes
- Validates upseller access to customers before processing payments
- Prevents unauthorized access to customer data

## 💼 **Business Logic**

### **Assignment Rules**
1. **One Active Assignment**: Each customer can have only one active assignment
2. **Automatic Deactivation**: New assignments automatically deactivate previous ones
3. **Transfer Tracking**: All transfers are logged with timestamps and notes
4. **Cascade Deletion**: Assignments are deleted when customer or upseller is deleted

### **Access Control Rules**
1. **Upseller Restriction**: Upsellers can only access assigned customers
2. **Payment Processing**: Payment operations require customer assignment
3. **Sales Creation**: New sales limited to assigned customers
4. **Data Isolation**: Complete data isolation between upsellers

## 🚀 **Usage Examples**

### **1. Assign Customer to Upseller**
```javascript
POST /api/assignments/assign
{
  "customer_id": 56,
  "upseller_id": 10,
  "assignment_type": "manual",
  "notes": "High-value customer for upselling"
}
```

### **2. Get Upseller's Assigned Customers**
```javascript
GET /api/assignments/my-assignments?status=active
```

### **3. Transfer Customer**
```javascript
POST /api/assignments/transfer
{
  "customer_id": 56,
  "new_upseller_id": 12,
  "notes": "Transferring due to territory change"
}
```

### **4. Get Upseller Statistics**
```javascript
GET /api/assignments/my-stats
// Returns: { total_customers, active_customers, total_sales, total_paid, total_remaining }
```

## 🔄 **Integration Points**

### **Payment System Integration**
- Payment routes automatically check customer assignments
- Upsellers can only process payments for assigned customers
- Payment history filtered by assignment

### **Sales System Integration**
- Sales creation restricted to assigned customers
- Sales data filtered by assignment
- Upsell opportunities tracked per upseller

### **Customer System Integration**
- Customer data access controlled by assignments
- Customer statistics calculated per upseller
- Assignment history maintained

## 📊 **Current Status**

### **✅ Completed Features**
- Database schema and migrations
- Complete service layer with all CRUD operations
- Full API endpoint coverage
- Access control middleware
- Payment system integration
- Comprehensive testing

### **📈 Test Results**
- ✅ Database connection established
- ✅ Customer assignment functionality working
- ✅ Upseller statistics calculation working
- ✅ Access control middleware functional
- ✅ API endpoints responding correctly

### **🎯 Ready for Production**
The Customer Assignment Module is **fully functional** and ready for production use. All core features are implemented and tested.

## 🛠️ **Maintenance & Monitoring**

### **Database Maintenance**
- Regular cleanup of inactive assignments
- Monitor assignment distribution
- Track transfer patterns

### **Performance Monitoring**
- Assignment query performance
- Middleware execution time
- API response times

### **Business Metrics**
- Customer assignment distribution
- Upseller performance tracking
- Transfer frequency analysis

## 🔮 **Future Enhancements**

### **Potential Features**
1. **Bulk Assignment** - Assign multiple customers at once
2. **Assignment Rules** - Automated assignment based on criteria
3. **Territory Management** - Geographic assignment automation
4. **Performance Analytics** - Advanced upseller performance metrics
5. **Assignment Notifications** - Email alerts for assignments/transfers

### **Integration Opportunities**
1. **CRM Integration** - Sync with external CRM systems
2. **Reporting Dashboard** - Visual assignment management
3. **Mobile App** - Mobile assignment management
4. **API Webhooks** - Real-time assignment notifications

---

## 🎉 **Summary**

The Customer Assignment Module provides a robust, secure, and scalable solution for managing customer-upseller relationships. It enables:

- **Structured Customer Management** - Clear ownership and responsibility
- **Secure Access Control** - Data isolation and permission management
- **Flexible Assignment Types** - Multiple assignment strategies
- **Comprehensive Reporting** - Performance tracking and analytics
- **Seamless Integration** - Works with existing payment and sales systems

The module is production-ready and provides a solid foundation for upselling operations and customer relationship management.
