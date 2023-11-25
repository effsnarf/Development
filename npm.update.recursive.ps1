$rootPath = Get-Location

Get-ChildItem -Path $rootPath -Recurse -Directory | ForEach-Object {
    $path = $_.FullName
    if (Test-Path "$path\package.json") {
        Write-Host "Updating npm packages in $path"
        Set-Location $path
        npm update
        Set-Location $rootPath
    }
}
