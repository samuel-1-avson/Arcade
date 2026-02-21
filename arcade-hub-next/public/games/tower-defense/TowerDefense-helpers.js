    // Start a game mode
    startMode(mode, options = {}) {
        this.gameModes.setMode(mode, options);
        this.hideOverlay();
        this.gameModes.showModeUI();
        this.reset();
    }

    // Load a specific level from story mode
    loadLevel(levelId) {
        const map = getMap(levelId);
        if (!map) {
            console.error('Map not found:', levelId);
            return;
        }

        this.currentMapId = levelId;
        this.currentMap = map.grid;
        this.gold = map.startGold || 150;
        this.lives = map.startLives || 20;
        
        // Recalculate path for new map
        this.path = calculatePath(this.currentMap);
        
        this.hideOverlay();
this.reset();
        
        // Show intro dialogue if available
        const chapter = this.storyMode.getChapterForLevel(levelId);
        if (chapter && chapter.levels[0] === levelId) {
            // First level of chapter
            this.storyMode.showDialogue(`chapter_${chapter.id}_start`);
        }
    }

    // Add gold with multiplier
    addGold(amount) {
        const goldGained = Math.floor(amount * (this.goldMultiplier || 1));
        this.gold += goldGained;
        this.stats.totalGold += goldGained;
        this.achievementSystem.incrementProgress('total_gold', goldGained);
        this.updateGoldDisplay();
    }
