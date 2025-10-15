const db = require('./db');
const PaymentService = require('./services/paymentService');

/**
 * Script to fix missing payment transactions for sales with initial cash_in amounts
 * This will create payment transaction records for sales that have cash_in > 0 but no corresponding payment transactions
 */

async function fixMissingPaymentTransactions() {
  console.log('🔍 Finding sales with missing payment transactions...');
  
  // Find sales that have cash_in > 0 but no payment transactions
  const missingTransactionsSql = `
    SELECT s.id, s.customer_id, s.cash_in, s.payment_source, s.created_at, s.created_by
    FROM sales s
    WHERE s.cash_in > 0 
      AND s.payment_source IS NOT NULL
      AND s.id NOT IN (
        SELECT DISTINCT pt.sale_id 
        FROM payment_transactions pt 
        WHERE pt.sale_id = s.id
      )
    ORDER BY s.created_at DESC
  `;
  
  return new Promise((resolve, reject) => {
    db.query(missingTransactionsSql, [], async (err, results) => {
      if (err) {
        console.error('❌ Error finding missing transactions:', err);
        return reject(err);
      }
      
      if (results.length === 0) {
        console.log('✅ No missing payment transactions found!');
        return resolve();
      }
      
      console.log(`📊 Found ${results.length} sales with missing payment transactions:`);
      results.forEach(sale => {
        console.log(`  - Sale ID ${sale.id}: $${sale.cash_in} ${sale.payment_source} (${sale.created_at})`);
      });
      
      console.log('\n🔄 Creating missing payment transactions...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const sale of results) {
        try {
          await PaymentService.recordPayment({
            saleId: sale.id,
            amount: sale.cash_in,
            paymentSource: sale.payment_source,
            transactionReference: `Backfill: Initial payment for sale ${sale.id}`,
            notes: 'Initial payment received at sale creation (backfilled)',
            createdBy: sale.created_by,
            receivedBy: sale.created_by
          });
          
          // Also update upseller performance for target tracking
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
            } else {
              console.log(`⚠️ No active upseller found for customer ${sale.customer_id} (Sale ID ${sale.id})`);
            }
          } catch (performanceError) {
            console.error(`❌ Failed to update upseller performance for Sale ID ${sale.id}:`, performanceError.message);
          }
          
          console.log(`✅ Created payment transaction for Sale ID ${sale.id}: $${sale.cash_in} ${sale.payment_source}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to create payment transaction for Sale ID ${sale.id}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n📈 Summary:`);
      console.log(`  ✅ Successfully created: ${successCount} payment transactions`);
      console.log(`  ❌ Failed to create: ${errorCount} payment transactions`);
      
      if (successCount > 0) {
        console.log('\n🎉 Payment transactions backfill completed!');
        console.log('💡 Commission tracking should now show all payments correctly.');
      }
      
      resolve();
    });
  });
}

// Run the script if called directly
if (require.main === module) {
  fixMissingPaymentTransactions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixMissingPaymentTransactions;
