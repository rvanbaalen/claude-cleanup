#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const packageJson = require('./package.json');

const CLAUDE_JSON_PATH = path.join(os.homedir(), '.claude.json');

// Parse command line arguments
const args = process.argv.slice(2);
let MAX_HISTORY_MESSAGES = 5;
let DRY_RUN = false;
let PASTED_CONTENTS_ONLY = false;

// Check for --max-messages flag
const maxMessagesIndex = args.indexOf('--max-messages');
if (maxMessagesIndex !== -1 && args[maxMessagesIndex + 1]) {
  const maxMessages = parseInt(args[maxMessagesIndex + 1], 10);
  if (!isNaN(maxMessages) && maxMessages > 0) {
    MAX_HISTORY_MESSAGES = maxMessages;
  } else {
    console.error('Error: --max-messages must be a positive integer');
    process.exit(1);
  }
}

// Check for --dry-run flag
if (args.includes('--dry-run')) {
  DRY_RUN = true;
}

// Check for --pasted-contents-only flag
if (args.includes('--pasted-contents-only')) {
  PASTED_CONTENTS_ONLY = true;
}

// Help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Claude Cleanup v${packageJson.version}
By Claude, for Claude.

Usage: npx @rvanbaalen/claude-cleanup [options]

Options:
  --max-messages <number>     Maximum number of messages to keep per conversation (default: 5)
  --pasted-contents-only      Only remove pastedContents fields, don't trim history
  --dry-run                   Show what would be cleaned without making changes
  --help, -h                  Show this help message

Examples:
  npx @rvanbaalen/claude-cleanup                       # Keep last 5 messages & remove pastedContents
  npx @rvanbaalen/claude-cleanup --max-messages 10     # Keep last 10 messages & remove pastedContents
  npx @rvanbaalen/claude-cleanup --pasted-contents-only # Only remove pastedContents fields
  npx @rvanbaalen/claude-cleanup --dry-run             # Preview changes without applying them
  `);
  process.exit(0);
}

function cleanObject(obj, stats = { pastedContentsRemoved: 0, historiesTrimmed: 0 }) {
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item, stats));
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'pastedContents') {
        // Remove pastedContents entirely
        stats.pastedContentsRemoved++;
        console.log(`  Removed pastedContents field (saved significant space)`);
        continue;
      } else if (key === 'history' && Array.isArray(value) && !PASTED_CONTENTS_ONLY) {
        // Trim history to last N messages (unless pasted-contents-only mode)
        if (value.length > MAX_HISTORY_MESSAGES) {
          cleaned[key] = value.slice(-MAX_HISTORY_MESSAGES);
          stats.historiesTrimmed++;
          console.log(`  Trimmed history from ${value.length} to ${MAX_HISTORY_MESSAGES} messages`);
        } else {
          cleaned[key] = value;
        }
      } else {
        // Recursively clean nested objects
        cleaned[key] = cleanObject(value, stats);
      }
    }
    
    return cleaned;
  }
  
  return obj;
}

async function main() {
  try {
    console.log(`Loading ${CLAUDE_JSON_PATH}...`);
    if (PASTED_CONTENTS_ONLY) {
      console.log('🗑️  PASTED CONTENTS ONLY MODE - Only removing pastedContents fields');
    } else {
      console.log(`Max messages per conversation: ${MAX_HISTORY_MESSAGES}`);
    }
    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    
    if (!fs.existsSync(CLAUDE_JSON_PATH)) {
      console.error(`Error: ${CLAUDE_JSON_PATH} not found`);
      process.exit(1);
    }
    
    // Get original file size
    const originalStats = fs.statSync(CLAUDE_JSON_PATH);
    console.log(`Original file size: ${(originalStats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Read and parse the file
    const rawData = fs.readFileSync(CLAUDE_JSON_PATH, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('Processing data...');
    const stats = { pastedContentsRemoved: 0, historiesTrimmed: 0 };
    const cleanedData = cleanObject(data, stats);
    
    // Calculate what the new size would be
    const cleanedJson = JSON.stringify(cleanedData, null, 2);
    const newSize = Buffer.byteLength(cleanedJson, 'utf8');
    const sizeSaved = originalStats.size - newSize;
    
    console.log('\n📊 Statistics:');
    console.log(`  - pastedContents fields removed: ${stats.pastedContentsRemoved}`);
    console.log(`  - conversation histories trimmed: ${stats.historiesTrimmed}`);
    console.log(`  - Original size: ${(originalStats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  - New size: ${(newSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  - Space saved: ${(sizeSaved / (1024 * 1024)).toFixed(2)} MB`);
    
    if (!DRY_RUN) {
      // Create backup
      const backupPath = CLAUDE_JSON_PATH + '.backup';
      console.log(`\nCreating backup at ${backupPath}...`);
      fs.copyFileSync(CLAUDE_JSON_PATH, backupPath);
      
      // Write cleaned data back
      fs.writeFileSync(CLAUDE_JSON_PATH, cleanedJson);
      
      console.log('\n✅ Cleanup completed!');
      console.log(`💾 Backup saved at: ${backupPath}`);
    } else {
      console.log('\n🔍 DRY RUN - No changes were made. Run without --dry-run to apply changes.');
    }
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in ${CLAUDE_JSON_PATH}:`, error.message);
    } else {
      console.error('Error processing file:', error.message);
    }
    process.exit(1);
  }
}

main();