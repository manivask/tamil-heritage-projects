$commentText = "Script Designer / AI Prompt Engineer : Manivasagam Karunakaran"

$commentFormats = @{
    ".py"   = "# $commentText`r`n"
    ".ps1"  = "# $commentText`r`n"
    ".js"   = "// $commentText`r`n"
    ".css"  = "/* $commentText */`r`n"
    ".html" = "<!-- $commentText -->`r`n"
    ".md"   = "<!-- $commentText -->`r`n"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceDir = Resolve-Path (Join-Path $scriptDir "..")

Write-Host "[*] Scanning workspace directory: $workspaceDir"

# Fetch files recursively excluding data, hidden gemini folders, and git folders
$files = Get-ChildItem -Path $workspaceDir -Recurse -File | Where-Object {
    $_.FullName -notmatch "data" -and 
    $_.FullName -notmatch "\.git" -and 
    $_.FullName -notmatch "\.gemini" -and
    $_.FullName -notmatch "brain" -and
    $_.Name -ne "add_header.py" -and
    $_.Name -ne "add_header.ps1"
}

foreach ($file in $files) {
    $ext = $file.Extension.ToLower()
    if ($commentFormats.ContainsKey($ext)) {
        $header = $commentFormats[$ext]
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Avoid duplicate header insertion
        if ($content -like "*$commentText*") {
            Write-Host "[*] Already contains header: $($file.Name)"
            continue
        }
        
        $newContent = ""
        # Handle python script shebang
        if ($ext -eq ".py" -and $content.StartsWith("#!")) {
            $lines = $content.Split("`n", 2)
            $shebang = $lines[0] + "`n"
            $rest = if ($lines.Count -gt 1) { $lines[1] } else { "" }
            $newContent = $shebang + $header + $rest
        } else {
            $newContent = $header + $content
        }
        
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "[+] Successfully added header to: $($file.Name)"
    }
}
