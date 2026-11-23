# Install the zh-CN language pack into the LearnHarness desktop app.
#
#   powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1 -Uninstall
#
# The desktop app stores its learning data under %APPDATA%\LearnHarness\data
# (macOS: ~/Library/Application Support/LearnHarness/data). Close the app first.

param(
    [string]$PluginsRoot = (Join-Path $env:APPDATA "LearnHarness\data\plugins"),
    [string]$Source = (Join-Path $PSScriptRoot "..\dist"),
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$pluginId = "zh-cn-language-pack-plus"
$stateFile = Join-Path (Split-Path $PluginsRoot -Parent) "plugins-state.json"

if (Get-Process -Name "LearnHarness","learnharness" -ErrorAction SilentlyContinue) {
    Write-Warning "LearnHarness is running. Quit it first, then run this script again."
    exit 1
}

function Read-State {
    if (-not (Test-Path $stateFile)) { return [pscustomobject]@{ version = 1; enabled = [pscustomobject]@{} } }
    $value = Get-Content $stateFile -Raw | ConvertFrom-Json
    if (-not $value.version) { throw "Unrecognised plugins-state.json: $stateFile" }
    return $value
}

function Get-EnabledMap($state) {
    $map = [ordered]@{}
    if ($null -eq $state.enabled) { return $map }
    if ($state.enabled -is [System.Collections.IDictionary]) {
        foreach ($key in $state.enabled.Keys) { $map[$key] = $state.enabled[$key] }
    } else {
        foreach ($property in $state.enabled.PSObject.Properties) { $map[$property.Name] = $property.Value }
    }
    return $map
}

if ($Uninstall) {
    $target = Join-Path $PluginsRoot $pluginId
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    $state = Read-State
    $map = Get-EnabledMap $state
    if ($map.Contains($pluginId)) {
        $map.Remove($pluginId)
        [pscustomobject]@{ version = 1; enabled = [pscustomobject]$map } | ConvertTo-Json -Depth 5 | Set-Content $stateFile -Encoding utf8
    }
    Write-Host "Removed $pluginId from $PluginsRoot"
    exit 0
}

$manifest = Join-Path $Source "manifest.json"
if (-not (Test-Path $manifest)) { throw "Built package not found: $manifest (run 'npm run build' first)" }
$value = Get-Content $manifest -Raw | ConvertFrom-Json
if ($value.id -ne $pluginId) { throw "Unexpected manifest id '$($value.id)'" }

New-Item -ItemType Directory -Force -Path $PluginsRoot | Out-Null
$target = Join-Path $PluginsRoot $pluginId
$dist = Join-Path $target "dist"
if (Test-Path $dist) {
    $backup = Join-Path $target ("dist.backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
    Move-Item $dist $backup
    Write-Host "Previous dist moved to $backup"
}
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Copy-Item (Join-Path $Source "*") $dist -Recurse -Force

$state = Read-State
$enabled = Get-EnabledMap $state
$enabled[$pluginId] = $true
[pscustomobject]@{ version = 1; enabled = [pscustomobject]$enabled } | ConvertTo-Json -Depth 5 | Set-Content $stateFile -Encoding utf8

Write-Host "Installed $pluginId $($value.version) -> $dist"
Write-Host "Enabled in $stateFile"
Write-Host "Start LearnHarness: Settings -> Community plugins shows the pack; the UI should be Chinese."
