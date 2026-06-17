import os
import re

files = [
    r'c:\anti-hospital-management\frontend\src\components\CreateRequest.jsx',
    r'c:\anti-hospital-management\frontend\src\components\ApproveRejectModal.jsx',
    r'c:\anti-hospital-management\frontend\src\components\ITCompletionModal.jsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace placeholder= back to label=
    content = re.sub(r'placeholder="([^"]+)"', r'label="\1"', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
