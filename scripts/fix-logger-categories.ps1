# Fix logger categories — replace LogCategory.SERVICE with correct file-specific categories
$root = 'c:\Users\samue\Desktop\project\ideas testing games\js'

$categoryMap = @{
    "ArcadeHub.js"              = "LogCategory.APP"
    "auth.js"                   = "LogCategory.AUTH"
    "leaderboard.js"            = "LogCategory.GAME"
    "dashboard.js"              = "LogCategory.UI"
    "friends.js"                = "LogCategory.SOCIAL"
    "ErrorHandler.js"           = "LogCategory.APP"
    "AnalyticsDashboard.js"     = "LogCategory.ANALYTICS"
    "LeaderboardList.js"        = "LogCategory.GAME"
    "env.js"                    = "LogCategory.APP"
    "firebase-config.js"        = "LogCategory.FIREBASE"
    "FirebaseService.js"        = "LogCategory.FIREBASE"
    "SyncEngine.js"             = "LogCategory.SYNC"
    "StorageManager.js"         = "LogCategory.STORAGE"
    "AudioManager.js"           = "LogCategory.AUDIO"
    "UnifiedMultiplayer.js"     = "LogCategory.GAME"
    "InputManager.js"           = "LogCategory.GAME"
    "HubSDK.js"                 = "LogCategory.APP"
    "SoundEffects.js"           = "LogCategory.AUDIO"
    "EventBus.js"               = "LogCategory.APP"
    "UserAccountService.js"     = "LogCategory.AUTH"
    "TournamentService.js"      = "LogCategory.GAME"
    "PresenceService.js"        = "LogCategory.PRESENCE"
    "StreamService.js"          = "LogCategory.STREAM"
    "PublicProfileService.js"   = "LogCategory.SOCIAL"
    "ChatService.js"            = "LogCategory.SOCIAL"
    "AudioService.js"           = "LogCategory.AUDIO"
    "ClientSideAggregator.js"   = "LogCategory.ANALYTICS"
    "LeaderboardService.js"     = "LogCategory.GAME"
    "FriendsService.js"         = "LogCategory.SOCIAL"
    "AchievementService.js"     = "LogCategory.GAME"
    "AnalyticsService.js"       = "LogCategory.ANALYTICS"
    "SchemaVersionService.js"   = "LogCategory.STORAGE"
    "EconomyService.js"         = "LogCategory.ECONOMY"
    "ABTestingService.js"       = "LogCategory.ANALYTICS"
    "GameLoaderService.js"      = "LogCategory.GAME"
    "PartyService.js"           = "LogCategory.PARTY"
    "GlobalStateManager.js"     = "LogCategory.APP"
    "LocalTournamentManager.js" = "LogCategory.GAME"
    "ZenModeService.js"         = "LogCategory.UI"
    "NotificationService.js"    = "LogCategory.UI"
    "DailyChallengeService.js"  = "LogCategory.GAME"
    "HudService.js"             = "LogCategory.UI"
    "BackgroundService.js"      = "LogCategory.UI"
    "NavigationService.js"      = "LogCategory.UI"
    "CommandPalette.js"         = "LogCategory.UI"
    "TransitionService.js"      = "LogCategory.UI"
    "LiveEventService.js"       = "LogCategory.SERVICE"
    "ArtifactService.js"        = "LogCategory.SERVICE"
    "connectionDiagnostics.js"  = "LogCategory.NETWORK"
    "OfflineManager.js"         = "LogCategory.NETWORK"
    "lazyLoad.js"               = "LogCategory.PERF"
    "rateLimiter.js"            = "LogCategory.SERVICE"
    "performance.js"            = "LogCategory.PERF"
    "ClientAnalytics.js"        = "LogCategory.ANALYTICS"
    "cache.js"                  = "LogCategory.PERF"
    "AuthUI.js"                 = "LogCategory.AUTH"
    "TournamentPanel.js"        = "LogCategory.GAME"
    "SocialPanel.js"            = "LogCategory.SOCIAL"
    "DashboardPanel.js"         = "LogCategory.UI"
}

$fixed = 0
Get-ChildItem -Path $root -Filter '*.js' -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    if ($content -notmatch 'LogCategory\.SERVICE') { return }
    if ($file.Name -eq 'logger.js') { return }
    
    $category = $categoryMap[$file.Name]
    if (-not $category -or $category -eq 'LogCategory.SERVICE') { return }
    
    $content = $content -replace 'LogCategory\.SERVICE', $category
    
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    $fixed++
    Write-Output "[FIXED] $($file.Name): SERVICE -> $category"
}

Write-Output ""
Write-Output "Fixed categories in $fixed files"
