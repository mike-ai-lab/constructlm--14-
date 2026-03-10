# Batch UTF-16 BOM to UTF-8 conversion script
$patterns = @('*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.css', '*.html')
$directories = @('./components', './services', './ai-editor')
$excludeDirs = @('node_modules', '.git', 'dist', 'build')
$convertedCount = 0
$skippedCount = 0

Write-Host "Starting encoding conversion..." -ForegroundColor Green

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Skipping $dir (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`nProcessing: $dir" -ForegroundColor Cyan
    
    foreach ($pattern in $patterns) {
        $files = @(Get-ChildItem -Path $dir -Filter $pattern -Recurse -ErrorAction SilentlyContinue)
        
        foreach ($file in $files) {
            $skip = $false
            foreach ($exclude in $excludeDirs) {
                if ($file.FullName -like "*\$exclude\*") {
                    $skip = $true
                    break
                }
            }
            
            if ($skip) { continue }
            
            try {
                $content = [System.IO.File]::ReadAllBytes($file.FullName)
                $isUTF16 = ($content.Count -gt 1) -and (
                    (($content[0] -eq 0xFF) -and ($content[1] -eq 0xFE)) -or
                    (($content[0] -eq 0xFE) -and ($content[1] -eq 0xFF))
                )
                
                if ($isUTF16) {
                    $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::Unicode)
                    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
                    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
                    $convertedCount++
                } else {
                    $skippedCount++
                }
            } catch {
                Write-Host "  ✗ $($file.Name): $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Converted: $convertedCount | Skipped: $skippedCount" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
