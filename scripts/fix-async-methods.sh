#!/bin/bash
# Fix non-async controller methods that use `return await`
# Approach: Use awk to identify method declarations without `async` but with `return await` in the body

TOTAL=0
FILES=0

fix_file() {
  local file="$1"
  local changed=0
  
  # Use python for more reliable multi-line parsing
  python3 - "$file" << 'PYEOF'
import sys
import re

file = sys.argv[1]
with open(file, 'r') as f:
    content = f.read()

lines = content.split('\n')
modified = False

i = 0
while i < len(lines):
    line = lines[i]
    # Match: 2 spaces + identifier + ( without `async` keyword
    # Not a comment, not constructor, not decorator line
    m = re.match(r'^  ([a-zA-Z_][a-zA-Z0-9_]*)(\s*\()', line)
    if m and 'async ' not in line and 'constructor' not in line:
        # Scan next lines for 'return await' within this method
        depth = 0
        found_return_await = False
        for j in range(i, min(i + 30, len(lines))):
            l = lines[j]
            depth += l.count('{') - l.count('}')
            if j > i and depth <= 0:
                break
            if re.search(r'\breturn await\b', l):
                found_return_await = True
                break
        
        if found_return_await:
            lines[i] = re.sub(r'^(  )([a-zA-Z_][a-zA-Z0-9_]*)(\s*\()', r'\1async \2\3', lines[i])
            modified = True
            print(f"  Fixed: {line.strip()[:60]}", file=sys.stderr)
    i += 1

if modified:
    with open(file, 'w') as f:
        f.write('\n'.join(lines))
    sys.exit(1)  # exit 1 = changed
sys.exit(0)  # no changes
PYEOF
  local ret=$?
  if [ $ret -eq 1 ]; then
    echo "Fixed: $file"
    FILES=$((FILES+1))
  fi
}

# Process all controller files
while IFS= read -r file; do
  fix_file "$file"
done < <(find apps/api/src -name "*.controller.ts" -type f)

echo ""
echo "Files fixed: $FILES"
