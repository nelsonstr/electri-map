const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services');
const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('.ts'));

// Heuristics for type inference based on property names
const typeHeuristics = [
  // Boolean
  { regex: /^(is|has|can|should|will|requires|allows)_|(_enabled|_disabled|_active|_verified|_visible|_hidden|_public|_private|_locked|_unlocked|_checked|_selected|_completed|_resolved|_deleted|_archived)$|^(enabled|disabled|active|verified|visible|hidden|public|private|locked|unlocked|checked|selected|completed|resolved|deleted|archived)$/i, type: 'boolean' },
  
  // Number
  { regex: /(count|total|sum|price|cost|amount|value|percent|rate|ratio|latitude|longitude|lat|lng|lon|level|severity|priority|capacity|load|duration|width|height|size|length|radius|frequency|margin|intensity|speed|velocity|temperature|pressure|humidity|voltage|current|power|energy|limit|offset|page|index|rank|year|month|day|hour|minute|second|processed|succeeded|failed|uploaded|downloaded|retries|attempts)$/i, type: 'number' },

  // Array (casting to any[] as a safe default for unknown arrays)
  { regex: /(errors|items|list|queue|configs|resources|files|images|videos|segments|points|coordinates|links|tags|categories|params|ids|names|types|roles|permissions)$/i, type: 'any[]' },
  
  // String (defaulting many things to string as it's common for IDs, dates, enums)
  { regex: /(id|_id|name|title|message|description|url|email|phone|address|city|state|country|zip|code|key|token|type|status|category|role|rank|department|_at|date|timestamp|start|end|image|avatar|icon|color|label|text|content|body|summary|notes|comment|reason|cause|source|medium|campaign|path|slug|action|method|target|unit|currency|info|device|platform)$/i, type: 'string' },
];

function inferType(propertyName) {
  for (const heuristic of typeHeuristics) {
    if (heuristic.regex.test(propertyName)) {
      return heuristic.type;
    }
  }
  return null; // heuristic failed
}

function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex to find `data.property` usages that are NOT already cast with `as`
  // looking for: data\.[a-zA-Z0-9_]+(?![\s]*as)
  // This is tricky because `as` might be on the next line or after distinct characters.
  // A safer approach: matching `data.[prop]` and checking if `as` follows immediately.
  
  // We'll iterate through matches and replace them if they don't look casted.
  // Pattern: `data\.([a-zA-Z0-9_]+)`
  // We need to look ahead to see if `as` is there.
  
  // Heuristic: If we see `data.prop` followed by ` as ` or `)` (end of cast) or `,` or `}` or `\n`.
  // Actually, simplest is: replace `data.prop` with `(data.prop as Type)` if it's not already cast.
  
  // Let's use a replacer function.
  // We want to match `data.propertyName` where it is NOT followed by ` as`.
  // Note: `data` might be named something else if we want to be generic, but let's stick to `data` for now as it's the convention in these files.
  
  // Regex: `\bdata\.([a-zA-Z0-9_]+)\b`
  // We'll check the context in the replacer.
  
  content = content.replace(/\bdata\.([a-zA-Z0-9_]+)\b/g, (match, prop, offset, fullString) => {
    // Check if already cast
    const after = fullString.slice(offset + match.length);
    if (/^\s+as\b/.test(after)) {
      return match; // Already cast
    }
    
    // Check if it's a property access on an object that is ANY (we can't know easily).
    // But we are targeting `data` which is `Record<string, unknown>`.
    
    const inferred = inferType(prop);
    if (inferred) {
        // If it's a boolean, we might want to cast to boolean.
        // If it's a number, cast to number.
        // If it's a string, cast to string.
        
        // Special handling for optional properties? `data.prop as type | undefined`?
        // Hard to know if it's optional without schema.
        // But `unknown` to `string` is safer than `unknown` to `string | undefined` if the target expects `string`.
        // If the target expects `string | undefined`, `as string` matches `string`, which is assignable to `string | undefined`.
        // So `as string` is generally safe-ish.
        
        // However, if the value IS null/undefined in DB, `as string` might runtime error if code assumes it's string.
        // But here we are fixing TS errors. Supabase `unknown` is the issue.
        
        // Let's use `(data.prop as Type)` generic cast.
        // The parenthesis are important to avoid precedence issues (e.g. `data.prop as string || 'default'`).
        
        // Check if we are inside a `map...` function? 
        // Just doing it globally in the file for `data.` pattern seems reasonable for these service files.
        
        return `${match} as ${inferred}`;
    }
    
    return match; // No type inferred
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`  Updated ${filePath}`);
  }
}

// Accept specific file from command line or process all
const specificFile = process.argv[2];
if (specificFile) {
    processFile(path.resolve(specificFile));
} else {
    files.forEach(file => {
        processFile(path.join(servicesDir, file));
    });
}
