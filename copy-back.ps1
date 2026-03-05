# Copy fixed files back to source repo
$sourceRepo = Get-Content ".\repo-path.txt" | Select-Object -First 1
$sourceRepo = $sourceRepo.Trim()

Write-Host "Copying files back to: $sourceRepo"

# Copy fixed files
Copy-Item ".\sketchup_temp\netlify.toml" -Destination $sourceRepo -Force
Write-Host "Copied: netlify.toml"

Copy-Item ".\sketchup_temp\.gitignore" -Destination $sourceRepo -Force
Write-Host "Copied: .gitignore"

# Remove server directory from source
$serverPath = Join-Path $sourceRepo "server"
if (Test-Path $serverPath) {
    Remove-Item $serverPath -Recurse -Force
    Write-Host "Removed: server/"
}

# Remove guide files with secrets
$guidesToRemove = @(
    "SketchUp Extensions Website - Local Development Setup Guide.md",
    "guide.md",
    "DEPLOYMENT_GUIDE.md"
)

foreach ($guide in $guidesToRemove) {
    $guidePath = Join-Path $sourceRepo $guide
    if (Test-Path $guidePath) {
        Remove-Item $guidePath -Force
        Write-Host "Removed: $guide"
    }
}

Write-Host "`nDone! Now commit and push from: $sourceRepo"
