import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Fix @JoinColumn name values (camelCase -> snake_case)
  content = content.replace(/@JoinColumn\(\s*\{([^}]*name:\s*)'([a-z][a-zA-Z0-9]+)'([^}]*)\}\)/g, (m, pre, val, post) => {
    const snake = camelToSnake(val);
    return snake !== val ? `@JoinColumn({${pre}'${snake}'${post}})` : m;
  });
  
  // Fix @Column decorators: add name: 'snake_case' if missing
  // Match @Column({...}) followed by property declaration
  const lines = content.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (/@Column\s*\(/.test(line)) {
      // Collect decorator block (might be multi-line)
      let decoratorEnd = i;
      let parenBalance = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      
      if (parenBalance <= 0) {
        // Single line decorator
        decoratorEnd = i;
      } else {
        // Multi-line - find closing paren
        let j = i + 1;
        while (j < lines.length && parenBalance > 0) {
          parenBalance += (lines[j].match(/\(/g) || []).length;
          parenBalance -= (lines[j].match(/\)/g) || []).length;
          if (parenBalance <= 0) {
            decoratorEnd = j;
            break;
          }
          j++;
        }
      }
      
      // Check if any decorator line already has name:
      let hasName = false;
      for (let k = i; k <= decoratorEnd; k++) {
        if (lines[k].includes('name:')) { hasName = true; break; }
      }
      
      // Find property name (first non-blank, non-decorator, non-comment line after decorator)
      let propIdx = decoratorEnd + 1;
      while (propIdx < lines.length) {
        const t = lines[propIdx].trim();
        if (t === '' || t.startsWith('@')) { propIdx++; }
        else break;
      }
      
      let propName = null;
      if (propIdx < lines.length) {
        const m = lines[propIdx].match(/^\s*(\w+)\s*[:;]/);
        if (m) propName = m[1];
      }
      
      if (!hasName && propName && !['id', 'createdAt', 'updatedAt', 'deletedAt', 'universityId'].includes(propName)) {
        const snake = camelToSnake(propName);
        if (snake !== propName) {
          // Add name to the last line of the decorator (before closing })
          const lastLineIdx = decoratorEnd;
          const lastLine = lines[lastLineIdx];
          
          // Find the closing } of the options object, insert name before it
          // The options object is the first { in @Column({...})
          // Find the matching closing }
          let braceDepth = 0;
          let firstBrace = -1;
          let insertPos = -1;
          for (let c = 0; c < lastLine.length; c++) {
            if (lastLine[c] === '{') {
              if (firstBrace === -1) firstBrace = c;
              braceDepth++;
            } else if (lastLine[c] === '}') {
              braceDepth--;
              if (braceDepth === 0 && firstBrace >= 0) {
                insertPos = c;
                break;
              }
            }
          }
          
          if (insertPos > 0) {
            const before = lastLine.slice(0, insertPos);
            const after = lastLine.slice(insertPos);
            const needsComma = /[,\s]$/.test(before.trimEnd()) || before.trimEnd().endsWith('{') ? '' : ',';
            lines[lastLineIdx] = before + `${needsComma} name: '${snake}'` + after;
          }
        }
      }
    }
    
    result.push(lines[i]);
  }
  
  const newContent = result.join('\n');
  if (newContent !== original) {
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  Fixed: ${filePath}`);
    return true;
  }
  return false;
}

const entitiesDir = join(process.cwd(), 'src', 'modules');
function findEntityFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findEntityFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.entity.ts')) files.push(full);
  }
  return files;
}

const files = findEntityFiles(entitiesDir);
try {
  for (const f of readdirSync(join(process.cwd(), 'src', 'common', 'entities'), { withFileTypes: true })) {
    if (f.isFile() && f.name.endsWith('.entity.ts')) files.push(join(process.cwd(), 'src', 'common', 'entities', f.name));
  }
} catch {}

console.log(`Processing ${files.length} entity files...`);
let fixed = 0;
for (const file of files) { if (processFile(file)) fixed++; }
console.log(`\nFixed ${fixed} files.`);
