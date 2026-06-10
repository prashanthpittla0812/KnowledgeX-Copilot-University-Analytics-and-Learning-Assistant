import os
import re

directory = r'c:\Users\Prashanth\Downloads\KnowledgeX Copilot – University Analytics and Learning Assistant\frontend\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match api.get, post, put, delete followed by ('/' or `/'
    # Make sure we don't double prefix if it's already /api/v1/
    new_content = re.sub(r'(api\.(?:get|post|put|delete)\(\s*)([\'"`])\/(?!api\/v1\/)', r'\1\2/api/v1/', content)
    
    # We also need to fix API_BASE_URL inside api.ts
    if filepath.endswith('api.ts'):
        # Fix the API_BASE_URL fallback to remove /api/v1
        new_content = new_content.replace('"http://localhost:8000/api/v1"', '"http://localhost:8000"')
    
    # Fix the redundant replaces in the components
    if 'LearningMaterialsTab.jsx' in filepath or 'LearningResourcesTab.jsx' in filepath:
        new_content = new_content.replace('.replace("/api/v1", "")', '')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            process_file(os.path.join(root, file))

print('Done.')
