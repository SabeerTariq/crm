const db = require('./db');
const CustomerSalesService = require('./services/customerSalesService');

async function testDashboardUpdate() {
  try {
    console.log('Testing dashboard update after remaining payment...');
    
    // Test with sale ID 49 (has remaining amount)
    const saleId = 49;
    const amount = 25.00; // Test with $25 payment
    const paymentMethod = 'cash';
    const paymentSource = 'test';
    const createdBy = 1; // Admin user
    const notes = 'Test dashboard update';
    const receivedBy = null; // This should trigger the upseller lookup
    
    console.log(`Processing $${amount} remaining payment for sale ${saleId}...`);
    
    // Get upseller performance before payment
    const beforeSql = `
      SELECT up.metric_value 
      FROM upseller_performance up 
      WHERE up.user_id = 10 AND up.metric_type = 'revenue_generated' 
      AND up.period_year = 2025 AND up.period_month = 9
    `;
    
    const beforeResults = await new Promise((resolve, reject) => {
      db.query(beforeSql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { metric_value: 0 });
      });
    });
    
    console.log(`Before payment - Upseller 10 performance: $${beforeResults.metric_value}`);
    
    // Process the remaining payment
    const result = await CustomerSalesService.processPayment(
      saleId,
      amount,
      paymentMethod,
      paymentSource,
      createdBy,
      notes,
      receivedBy
    );
    
    console.log('Payment result:', result);
    
    // Get upseller performance after payment
    const afterResults = await new Promise((resolve, reject) => {
      db.query(beforeSql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { metric_value: 0 });
      });
    });
    
    console.log(`After payment - Upseller 10 performance: $${afterResults.metric_value}`);
    
    const performanceIncrease = afterResults.metric_value - beforeResults.metric_value;
    console.log(`Performance increased by: $${performanceIncrease}`);
    
    // Test the dashboard API endpoint
    console.log('\nTesting dashboard API endpoint...');
    const dashboardSql = `
      SELECT COALESCE(up.metric_value, 0) as total_cash_in
      FROM upseller_performance up 
      WHERE up.user_id = 10 AND up.metric_type = 'revenue_generated' 
      AND up.period_year = 2025 AND up.period_month = 9
    `;
    
    const dashboardResults = await new Promise((resolve, reject) => {
      db.query(dashboardSql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { total_cash_in: 0 });
      });
    });
    
    console.log(`Dashboard shows total cash in: $${dashboardResults.total_cash_in}`);
    
    if (dashboardResults.total_cash_in === afterResults.metric_value) {
      console.log('✅ SUCCESS: Dashboard shows correct amount!');
    } else {
      console.log('❌ FAILED: Dashboard amount mismatch');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    db.end();
  }
}

// Run the test
testDashboardUpdate();
