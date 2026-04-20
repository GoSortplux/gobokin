import re

def get_imports(content):
    imports = set()
    # Standard imports
    for match in re.finditer(r'import\s+([A-Z][a-zA-Z0-9]*)\s+from', content):
        imports.add(match.group(1))
    # Destructured imports
    for match in re.finditer(r'import\s+\{([^}]+)\}\s+from', content):
        for part in match.group(1).split(','):
            imports.add(part.strip().split(' as ')[-1].strip())
    # Local consts
    for match in re.finditer(r'const\s+([A-Z][a-zA-Z0-9]*)\s*=', content):
        imports.add(match.group(1))
    return imports

def get_tags(content):
    return set(re.findall(r'<([A-Z][a-zA-Z0-9]*)', content))

def check(path):
    with open(path, 'r') as f:
        content = f.read()
    imports = get_imports(content)
    tags = get_tags(content)
    # Ignore some built-in or React specific things
    ignored = {'React', 'Image', 'Link', 'Fragment', 'LivePreviewProps', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement'}
    missing = tags - imports - ignored
    if missing:
        print(f"File: {path}")
        print(f"Missing components: {missing}")

check('src/app/organizer/dashboard/events/create/page.tsx')
check('src/app/organizer/dashboard/events/[eventId]/edit/page.tsx')
