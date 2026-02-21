/**
 * GameBridge - Legacy Wrapper for unified HubSDK
 * This file is kept for backward compatibility with older games.
 * It now points to the new HubSDK master bridge.
 */
import { GameBridge as MasterBridge } from '../engine/HubSDK.js';

// Re-expose the unified bridge under the old name
const GameBridge = MasterBridge;

if (typeof window !== 'undefined') {
    window.GameBridge = GameBridge;
}

export default GameBridge;
