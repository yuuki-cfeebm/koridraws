import os

# Set the path to your project folder
project_dir = 'C:/Users/ryanl/fatec/koridraws'
output_file = 'project_context.txt'

# Add the file extensions you want me to read
extensions = ('.css', '.js', '.html', '.py', '.json')

with open(output_file, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk(project_dir):
        for file in files:
            if file.endswith(extensions):
                file_path = os.path.join(root, file)
                outfile.write(f"\n\n{'='*40}\n")
                outfile.write(f"FILE: {file_path}\n")
                outfile.write(f"{'='*40}\n\n")
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Error reading file: {e}\n")

print("Context file created successfully!")