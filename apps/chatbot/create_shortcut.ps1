$wsh = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path -Path $desktopPath -ChildPath "Voice AI Copilot.lnk"

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "c:\Users\maniv\all_ide_code_ws\apps\chatbot\launch_chatbot.bat"
$shortcut.WorkingDirectory = "c:\Users\maniv\all_ide_code_ws"
$shortcut.WindowStyle = 7
$shortcut.Description = "Voice AI Copilot - Assistant, Stories & Deals"
$shortcut.Save()

Write-Output "Desktop shortcut created at: $shortcutPath"
