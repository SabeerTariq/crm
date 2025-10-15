const db = require('./db');
const PaymentService = require('./services/paymentService');

/**
 * Script to update upseller performance for existing sales with initial cash_in amounts
 * This will update the upseller_performance table for sales that have cash_in > 0
 */

async function updateUpsellerPerformanceForExistingSales() {
  console.log('🔍 Finding sales with cash_in that need upseller performance updates...');
  
  // Find sales that have cash_in > 0 and need upseller performance updates
  const salesSql = `
    SELECT s.id, s.customer_id, s.cash_in, s.payment_source, s.created_at, s.created_by
    FROM sales s
    WHERE s.cash_in > 0 
      AND s.payment_source IS NOT NULL
    ORDER BY s.created_at DESC
  `;
  
  return new Promise((resolve, reject) => {
    db.query(salesSql, [], async (err, results) => {
      if (err) {
        console.error('❌ Error finding sales:', err);
        return reject(err);
      }
      
      if (results.length === 0) {
        console.log('✅ No sales found!');
        return resolve();
      }
      
      console.log(`📊 Found ${results.length} sales with cash_in amounts:`);
      results.forEach(sale => {
        console.log(`  - Sale ID ${sale.id}: $${sale.cash_in} ${sale.payment_source} (${sale.created_at})`);
      });
      
      console.log('\n🔄 Updating upseller performance for existing sales...');
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      for (const sale of results) {
        try {
          // Get the upseller assigned to this customer
          const upsellerQuery = `
            SELECT ca.upseller_id 
            FROM customer_assignments ca 
            WHERE ca.customer_id = ? AND ca.status = 'active'
            LIMIT 1
          `;
          
          const upsellerResults = await new Promise((resolve, reject) => {
            db.query(upsellerQuery, [sale.customer_id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (upsellerResults.length > 0) {
            const upsellerId = upsellerResults[0].upseller_id;
            console.log(`📊 Updating upseller performance for upseller ${upsellerId} with amount ${sale.cash_in}`);
            
            await PaymentService.updateUpsellerPerformance(upsellerId, sale.cash_in);
            console.log(`✅ Upseller performance updated for Sale ID ${sale.id}`);
            successCount++;
          } else {
            console.log(`⚠️ No active upseller found for customer ${sale.customer_id} (Sale ID ${sale.id}) - Skipping`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to update upseller performance for Sale ID ${sale.id}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n📈 Summary:`);
      console.log(`  ✅ Successfully updated: ${successCount} upseller performance records`);
      console.log(`  ⚠️ Skipped (no upseller): ${skippedCount} sales`);
      console.log(`  ❌ Failed to update: ${errorCount} sales`);
      
      if (successCount > 0) {
        console.log('\n🎉 Upseller performance backfill completed!');
        console.log('💡 Target achieved should now show correct values.');
      }
      
      resolve();
    });
  });
}

// Run the script if called directly
if (require.main === module) {
  updateUpsellerPerformanceForExistingSales()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = updateUpsellerPerformanceForExistingSales;
