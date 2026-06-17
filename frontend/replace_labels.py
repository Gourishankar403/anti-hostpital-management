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
    
    lines = content.split('\n')
    for i in range(len(lines)):
        if 'TextField' in lines[i]:
            lines[i] = re.sub(r'label=([\'"][^\'"]+[\'"])', r'placeholder=\1', lines[i])
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
print('Replaced label with placeholder in all files')
