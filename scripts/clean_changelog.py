import re

with open(r'CHANGELOG_FX.md', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'-\s*\r?\n\s*regression_', '- regression_', text)

with open(r'CHANGELOG_FX.md', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleaned successfully!')
