import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1337'),
  database: process.env.DB_NAME || 'overpower',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

function findGaps(numbers: number[]): number[] {
  if (numbers.length === 0) return [];
  
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const gaps: number[] = [];
  
  for (let i = min; i <= max; i++) {
    if (!sorted.includes(i)) {
      gaps.push(i);
    }
  }
  
  return gaps;
}

async function analyzeSetNumberGaps() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyzing set_number gaps across all tables...\n');
    
    const tables = [
      'characters',
      'special_cards',
      'power_cards',
      'missions',
      'events',
      'aspects',
      'advanced_universe_cards',
      'teamwork_cards',
      'ally_universe_cards',
      'training_cards',
      'basic_universe_cards',
      'locations'
    ];
    
    const results: Array<{
      table: string;
      min: number | null;
      max: number | null;
      count: number;
      gaps: number[];
    }> = [];
    
    for (const table of tables) {
      const query = `
        SELECT set_number
        FROM ${table}
        WHERE set_number IS NOT NULL
        ORDER BY CAST(set_number AS INTEGER)
      `;
      
      const result = await client.query(query);
      const setNumbers = result.rows.map(row => parseInt(row.set_number));
      
      if (setNumbers.length === 0) {
        results.push({
          table,
          min: null,
          max: null,
          count: 0,
          gaps: []
        });
      } else {
        const min = Math.min(...setNumbers);
        const max = Math.max(...setNumbers);
        const gaps = findGaps(setNumbers);
        
        results.push({
          table,
          min,
          max,
          count: setNumbers.length,
          gaps
        });
      }
    }
    
    // Print results
    console.log('┌─────────────────────────────┬─────────┬─────────┬─────────┬─────────────────────────────────────────┐');
    console.log('│ Table                       │ Min     │ Max     │ Count   │ Gaps                                    │');
    console.log('├─────────────────────────────┼─────────┼─────────┼─────────┼─────────────────────────────────────────┤');
    
    for (const result of results) {
      const minStr = result.min !== null ? result.min.toString() : 'N/A';
      const maxStr = result.max !== null ? result.max.toString() : 'N/A';
      const countStr = result.count.toString();
      
      let gapsStr = 'None';
      if (result.gaps.length > 0) {
        if (result.gaps.length <= 10) {
          gapsStr = result.gaps.join(', ');
        } else {
          gapsStr = `${result.gaps.slice(0, 10).join(', ')} ... (+${result.gaps.length - 10} more)`;
        }
      } else if (result.min !== null && result.max !== null && result.count > 0) {
        gapsStr = 'Complete';
      }
      
      console.log(`│ ${result.table.padEnd(27)} │ ${minStr.padStart(7)} │ ${maxStr.padStart(7)} │ ${countStr.padStart(7)} │ ${gapsStr.padEnd(39)} │`);
    }
    
    console.log('└─────────────────────────────┴─────────┴─────────┴─────────┴─────────────────────────────────────────┘\n');
    
    // Detailed gap analysis for tables with gaps
    const tablesWithGaps = results.filter(r => r.gaps.length > 0);
    if (tablesWithGaps.length > 0) {
      console.log('📋 Detailed gap analysis:\n');
      for (const result of tablesWithGaps) {
        console.log(`${result.table}:`);
        console.log(`  Range: ${result.min} - ${result.max}`);
        console.log(`  Total set_numbers: ${result.count}`);
        console.log(`  Missing numbers: ${result.gaps.length}`);
        
        if (result.gaps.length <= 20) {
          console.log(`  Gaps: ${result.gaps.join(', ')}`);
        } else {
          // Group consecutive gaps
          const gapRanges: string[] = [];
          let rangeStart = result.gaps[0];
          let rangeEnd = result.gaps[0];
          
          for (let i = 1; i < result.gaps.length; i++) {
            if (result.gaps[i] === rangeEnd + 1) {
              rangeEnd = result.gaps[i];
            } else {
              if (rangeStart === rangeEnd) {
                gapRanges.push(rangeStart.toString());
              } else {
                gapRanges.push(`${rangeStart}-${rangeEnd}`);
              }
              rangeStart = result.gaps[i];
              rangeEnd = result.gaps[i];
            }
          }
          
          if (rangeStart === rangeEnd) {
            gapRanges.push(rangeStart.toString());
          } else {
            gapRanges.push(`${rangeStart}-${rangeEnd}`);
          }
          
          console.log(`  Gaps: ${gapRanges.join(', ')}`);
        }
        console.log('');
      }
    }
    
    // Overall summary
    const allSetNumbers: number[] = [];
    for (const result of results) {
      if (result.min !== null && result.max !== null) {
        const query = `
          SELECT CAST(set_number AS INTEGER) as num
          FROM ${result.table}
          WHERE set_number IS NOT NULL
        `;
        const result2 = await client.query(query);
        allSetNumbers.push(...result2.rows.map(row => row.num));
      }
    }
    
    if (allSetNumbers.length > 0) {
      const overallMin = Math.min(...allSetNumbers);
      const overallMax = Math.max(...allSetNumbers);
      const overallGaps = findGaps(allSetNumbers);
      
      console.log('🌐 Overall Summary (across all tables):');
      console.log(`  Range: ${overallMin} - ${overallMax}`);
      console.log(`  Total unique set_numbers: ${new Set(allSetNumbers).size}`);
      console.log(`  Missing numbers: ${overallGaps.length}`);
      
      if (overallGaps.length > 0 && overallGaps.length <= 50) {
        console.log(`  Gaps: ${overallGaps.join(', ')}`);
      } else if (overallGaps.length > 50) {
        // Group consecutive gaps
        const gapRanges: string[] = [];
        let rangeStart = overallGaps[0];
        let rangeEnd = overallGaps[0];
        
        for (let i = 1; i < overallGaps.length; i++) {
          if (overallGaps[i] === rangeEnd + 1) {
            rangeEnd = overallGaps[i];
          } else {
            if (rangeStart === rangeEnd) {
              gapRanges.push(rangeStart.toString());
            } else {
              gapRanges.push(`${rangeStart}-${rangeEnd}`);
            }
            rangeStart = overallGaps[i];
            rangeEnd = overallGaps[i];
          }
        }
        
        if (rangeStart === rangeEnd) {
          gapRanges.push(rangeStart.toString());
        } else {
          gapRanges.push(`${rangeStart}-${rangeEnd}`);
        }
        
        console.log(`  Gaps: ${gapRanges.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeSetNumberGaps();

