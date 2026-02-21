# Console.log Replacement Script for Arcade Gaming Hub
# Replaces console.log/console.warn with structured logger calls
# Preserves console.error in ErrorHandler.js (error boundary)
# Preserves console.log in development-only diagnostic utilities

param(
    [switch]$DryRun = $false
)

$root = "c:\Users\samue\Desktop\project\ideas testing games\js"
$importLine = "import { logger, LogCategory } from "

# Map directories to categories
$categoryMap = @{
    "engine/FirebaseService"       = "LogCategory.FIREBASE"
    "engine/SyncEngine"            = "LogCategory.SYNC"
    "engine/StorageManager"        = "LogCategory.STORAGE"
    "engine/AudioManager"          = "LogCategory.AUDIO"
    "engine/UnifiedMultiplayer"    = "LogCategory.GAME"
    "engine/InputManager"          = "LogCategory.GAME"
    "engine/HubSDK"                = "LogCategory.APP"
    "engine/SoundEffects"          = "LogCategory.AUDIO"
    "engine/EventBus"              = "LogCategory.APP"
    "services/UserAccountService"  = "LogCategory.AUTH"
    "services/TournamentService"   = "LogCategory.GAME"
    "services/PresenceService"     = "LogCategory.PRESENCE"
    "services/StreamService"       = "LogCategory.STREAM"
    "services/PublicProfileService"= "LogCategory.SOCIAL"
    "services/ChatService"         = "LogCategory.SOCIAL"
    "services/AudioService"        = "LogCategory.AUDIO"
    "services/ClientSideAggregator"= "LogCategory.ANALYTICS"
    "services/LeaderboardService"  = "LogCategory.GAME"
    "services/FriendsService"      = "LogCategory.SOCIAL"
    "services/AchievementService"  = "LogCategory.GAME"
    "services/AnalyticsService"    = "LogCategory.ANALYTICS"
    "services/SchemaVersionService"= "LogCategory.STORAGE"
    "services/EconomyService"      = "LogCategory.ECONOMY"
    "services/ABTestingService"    = "LogCategory.ANALYTICS"
    "services/GameLoaderService"   = "LogCategory.GAME"
    "services/PartyService"        = "LogCategory.PARTY"
    "services/GlobalStateManager"  = "LogCategory.APP"
    "services/LocalTournamentManager"= "LogCategory.GAME"
    "services/ZenModeService"      = "LogCategory.UI"
    "services/NotificationService" = "LogCategory.UI"
    "services/DailyChallengeService"= "LogCategory.GAME"
    "services/HudService"          = "LogCategory.UI"
    "services/BackgroundService"   = "LogCategory.UI"
    "services/NavigationService"   = "LogCategory.UI"
    "services/CommandPalette"      = "LogCategory.UI"
    "services/TransitionService"   = "LogCategory.UI"
    "services/LiveEventService"    = "LogCategory.SERVICE"
    "services/ArtifactService"     = "LogCategory.SERVICE"
    "app/ArcadeHub"                = "LogCategory.APP"
    "app/auth"                     = "LogCategory.AUTH"
    "app/dashboard"                = "LogCategory.UI"
    "app/leaderboard"              = "LogCategory.GAME"
    "app/social/friends"           = "LogCategory.SOCIAL"
    "utils/connectionDiagnostics"  = "LogCategory.NETWORK"
    "utils/OfflineManager"         = "LogCategory.NETWORK"
    "utils/lazyLoad"               = "LogCategory.PERF"
    "utils/rateLimiter"            = "LogCategory.SERVICE"
    "utils/performance"            = "LogCategory.PERF"
    "utils/ClientAnalytics"        = "LogCategory.ANALYTICS"
    "utils/cache"                  = "LogCategory.PERF"
    "components/ErrorHandler"      = "LogCategory.APP"
    "components/AnalyticsDashboard"= "LogCategory.ANALYTICS"
    "components/LeaderboardList"   = "LogCategory.GAME"
    "features/auth/AuthUI"         = "LogCategory.AUTH"
    "features/tournaments/TournamentPanel"= "LogCategory.GAME"
    "features/social/SocialPanel"  = "LogCategory.SOCIAL"
    "features/dashboard/DashboardPanel"= "LogCategory.UI"
    "config/firebase-config"       = "LogCategory.FIREBASE"
    "config/env"                   = "LogCategory.APP"
}

$totalReplaced = 0
$filesModified = 0

# Process each JS file with console.log calls
Get-ChildItem -Path $root -Filter "*.js" -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Skip if no console.log/console.warn
    if ($content -notmatch 'console\.(log|warn)') { return }
    
    # Skip the logger itself
    if ($file.Name -eq 'logger.js') { return }
    
    # Skip GameEngine.js (base engine class - may be used by game iframes)
    if ($file.Name -eq 'GameEngine.js') { return }
    
    # Determine category from file path
    $relPath = $file.FullName.Replace($root + '\', '').Replace('\', '/').Replace('.js', '')
    $category = $categoryMap[$relPath]
    if (-not $category) { $category = "LogCategory.SERVICE" }
    
    # Determine relative import path
    $dir = $file.DirectoryName.Replace($root + '\', '').Replace('\', '/')
    $depth = ($dir -split '/').Count
    $prefix = '../' * $depth
    $importStatement = "import { logger, LogCategory } from '${prefix}utils/logger.js';"
    
    $originalContent = $content
    $replacements = 0
    
    # Replace console.log(...) with logger.info(category, ...)
    $content = [regex]::Replace($content, 'console\.log\(', "logger.info($category, ")
    $replacements += ([regex]::Matches($originalContent, 'console\.log\(').Count)
    
    # Replace console.warn(...) with logger.warn(category, ...) 
    $beforeWarn = $content
    $content = [regex]::Replace($content, 'console\.warn\(', "logger.warn($category, ")
    $replacements += ([regex]::Matches($beforeWarn, 'console\.warn\(').Count)
    
    # Replace console.error(...) with logger.error(category, ...) 
    # EXCEPT in ErrorHandler.js where we keep raw console.error
    if ($file.Name -ne 'ErrorHandler.js') {
        $beforeError = $content
        $content = [regex]::Replace($content, 'console\.error\(', "logger.error($category, ")
        $replacements += ([regex]::Matches($beforeError, 'console\.error\(').Count)
    }
    
    # Replace console.group/console.groupEnd (dev-only debugging)
    $content = $content -replace 'console\.group\(', "logger.debug($category, 'GROUP:', "
    $content = $content -replace 'console\.groupEnd\(\)', "// groupEnd"
    
    if ($replacements -eq 0) { return }
    
    # Add import if not already present  
    if ($content -notmatch "import.*logger.*from") {
        # Find the last import line and add after it
        if ($content -match '(?m)(^import .+$)') {
            $allImports = [regex]::Matches($content, '(?m)^import .+$')
            $lastImport = $allImports[$allImports.Count - 1]
            $insertPos = $lastImport.Index + $lastImport.Length
            $content = $content.Insert($insertPos, "`n$importStatement")
        } else {
            # No imports, add at top (after any doc comment)
            $content = "$importStatement`n$content"
        }
    }
    
    if ($DryRun) {
        Write-Output "[DRY RUN] $relPath.js: $replacements replacements"
    } else {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        Write-Output "[MODIFIED] $relPath.js: $replacements replacements"
    }
    
    $totalReplaced += $replacements
    $filesModified++
}

Write-Output ""
Write-Output "Total: $totalReplaced replacements across $filesModified files"
