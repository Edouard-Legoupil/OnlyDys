import zipfile
import os
import sys

def package_plugin():
    plugin_name = "OnlyDys.plugin"
    deploy_dir = "deploy"
    if not os.path.exists(deploy_dir):
        os.makedirs(deploy_dir)

    plugin_file_path = os.path.join(deploy_dir, plugin_name)
    
    # Files and directories to exclude
    excludes = [
        '.git',
        '.github',
        '.vscode',
        'package_plugin.py',
        '__pycache__',
        '.DS_Store',
        plugin_name,
        deploy_dir
    ]

    print(f"Creating {plugin_file_path}...")

    with zipfile.ZipFile(plugin_file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through the current directory
        for root, dirs, files in os.walk('.'):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in excludes]
            
            for file in files:
                if file in excludes:
                    continue
                
                file_path = os.path.join(root, file)
                # Archive name should be relative to the root of the plugin folder
                archive_name = os.path.relpath(file_path, '.')
                
                print(f"  Adding: {archive_name}")
                zipf.write(file_path, archive_name)

    print(f"\nSuccessfully created {plugin_file_path}")
    print("You can now install this file in OnlyOffice Desktop Editors.")

if __name__ == "__main__":
    package_plugin()
