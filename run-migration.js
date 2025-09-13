import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zwhsieaiwnfmolpkyxkj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, executing...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', data);
    
    // Test the migration by checking if tables exist
    console.log('🔍 Verifying tables...');
    
    const tables = ['users', 'summaries', 'referrals', 'usage_logs', 'payment_transactions'];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);
        
      if (tableError) {
        console.log(`⚠️  Table ${table}: ${tableError.message}`);
      } else {
        console.log(`✅ Table ${table}: exists`);
      }
    }
    
  } catch (error) {
    console.error('💥 Migration script error:', error);
  }
}

runMigration();
