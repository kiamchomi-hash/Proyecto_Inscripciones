import re
import json

def convert_js_to_json(js_content):
    # This is a very targeted conversion for the specific format of careersData
    # Remove JS comments
    content = re.sub(r'//.*', '', js_content)
    
    # Replace single quotes with double quotes
    content = content.replace("'", '"')
    
    # Fix keys (ensure they are quoted) - search for alphanumeric keys or keys with spaces followed by colon
    # For this specific file, keys like 'Abogacía' are already in single quotes, so they became double quotes.
    # We need to fix properties like level:, duration:, etc.
    content = re.sub(r'(\w+):', r'"\1":', content)
    
    # Remove trailing commas before closing braces/brackets
    content = re.sub(r',\s*([}\]])', r'\1', content)
    
    return content

# The block from line 1544 to 1906
with open(r'c:\Users\matia\Desktop\Página_siglo\paginasiglo.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    data_lines = lines[1543:1906] # 0-indexed, so 1544 is 1543
    js_block = "".join(data_lines)
    # Remove the 'const careersData = ' part and the final semicolon
    js_block = js_block.replace('const careersData = ', '', 1).rsplit(';', 1)[0]
    
    json_str = convert_js_to_json(js_block)
    
    try:
        data = json.loads(json_str)
        with open(r'c:\Users\matia\Desktop\Página_siglo\datos_carreras.json', 'w', encoding='utf-8') as jf:
            json.dump(data, jf, indent=2, ensure_ascii=False)
        print("Successfully created datos_carreras.json")
    except Exception as e:
        print(f"Error: {e}")
        # If it fails, print a bit of the problematic string for debugging
        print(json_str[:500])
