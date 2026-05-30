import re

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Remove self-closing tags
    content = re.sub(r'<div[^>]*/>', '', content)

    opens = re.findall(r'<div', content)
    closes = re.findall(r'</div>', content)

    print(f"Opens: {len(opens)}, Closes: {len(closes)}")

    # Simple stack based check
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # This is very naive as it doesn't handle multiple tags per line perfectly but good enough
        for m in re.finditer(r'<(div)|(/div)>', line):
            if m.group(1):
                stack.append(i + 1)
            else:
                if not stack:
                    print(f"Extra closing tag at line {i+1}")
                else:
                    stack.pop()

    if stack:
        print(f"Unclosed tags opened at lines: {stack}")

check_balance('src/app/host-event/page.tsx')
