import os
import re

file_path = r'c:\anti-hospital-management\frontend\src\components\CreateRequest.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace placeholder= back to label=
content = re.sub(r'placeholder="([^"]+)"', r'label="\1"', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
