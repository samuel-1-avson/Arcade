# Fix logger import paths — corrects relative depth for each file
$root = 'c:\Users\samue\Desktop\project\ideas testing games\js'

Get-ChildItem -Path $root -Filter '*.js' -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    if ($content -notmatch 'import.*logger.*from') { return }
    if ($file.Name -eq 'logger.js') { return }
    
    # Calculate depth: how many folders deep from $root
    $rel = $file.DirectoryName.Substring($root.Length).TrimStart('\').Replace('\', '/')
    if ($rel -eq '') {
        $depth = 0
    }
    else {
        $depth = ($rel -split '/').Count
    }
    
    $prefix = ''
    for ($i = 0; $i -lt $depth; $i++) {
        $prefix += '../'
    }
    
    $newImport = "import { logger, LogCategory } from '" + $prefix + "utils/logger.js';"
    
    # Replace the import line
    $content = [regex]::Replace($content, "import \{ logger, LogCategory \} from '[^']+';", $newImport)
    
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    Write-Output "$($file.Name): depth=$depth -> ${prefix}utils/logger.js"
}
