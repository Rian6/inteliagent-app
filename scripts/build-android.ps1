param(
    [string]$SdkPath = "$env:LOCALAPPDATA/Android/Sdk",
    [string]$Architecture = 'arm64-v8a'
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$workspaceRoot = Split-Path -Parent $projectRoot
if (-not (Test-Path -LiteralPath $SdkPath)) { throw "Android SDK não encontrado: $SdkPath" }
$env:ANDROID_HOME = $SdkPath
$env:GRADLE_USER_HOME = Join-Path $workspaceRoot '.cache/gradle'
$localNode = Join-Path $workspaceRoot '.tools/node-v26.13.0-win-x64'
if (Test-Path -LiteralPath $localNode) { $env:PATH = "$localNode;$env:PATH" }
Remove-Item Env:DEBUG -ErrorAction SilentlyContinue
Push-Location (Join-Path $projectRoot 'android')
try {
    $ErrorActionPreference = 'Continue' # Windows PowerShell treats Gradle stderr warnings as errors.
    & .\gradlew.bat :app:assembleDebug --no-daemon --max-workers=2 "-PreactNativeArchitectures=$Architecture"
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0) { throw 'A compilação Android falhou.' }
} finally { Pop-Location }
