/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */
import { getMaxScore } from '../config/gameRegistry.js';

/**
 * Sanitize HTML to prevent XSS
 * Converts special characters to HTML entities
 * @param {string} text - Raw text input
 * @returns {string} - Sanitized HTML-safe text
 */
export function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize text for Firebase storage
 * Removes control characters and null bytes
 * @param {string} text - Raw text input
 * @returns {string} - Firebase-safe text
 */
export function sanitizeForFirebase(text) {
    if (typeof text !== 'string') return '';
    
    // Remove control characters (0x00-0x1F) except common whitespace
    // Allow: \t (0x09), \n (0x0A), \r (0x0D)
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
}

/**
 * Sanitize user display name
 * @param {string} name - Raw display name
 * @returns {string} - Sanitized name
 */
export function sanitizeDisplayName(name) {
    if (typeof name !== 'string') return 'Player';
    
    return name
        .replace(/[<>"']/g, '') // Remove < > " '
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
        .trim()
        .slice(0, 20); // Max 20 characters
}

/**
 * Sanitize chat message
 * @param {string} message - Raw chat message
 * @returns {string} - Sanitized message
 */
export function sanitizeChatMessage(message) {
    if (typeof message !== 'string') return '';
    
    return message
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
        .trim()
        .slice(0, 500); // Max 500 characters
}

/**
 * Validate and sanitize score data
 * @param {number} score - Raw score value
 * @param {string} gameId - Game identifier
 * @returns {object} - Validation result
 */
export function validateScore(score, gameId) {
    const result = {
        valid: false,
        sanitizedScore: 0,
        errors: []
    };
    
    // Must be a number
    if (typeof score !== 'number' || isNaN(score)) {
        result.errors.push('Score must be a number');
        return result;
    }
    
    // Must be non-negative
    if (score < 0) {
        result.errors.push('Score cannot be negative');
        return result;
    }
    
    // Must be integer
    if (!Number.isInteger(score)) {
        result.errors.push('Score must be an integer');
        return result;
    }
    
    // Game-specific max scores from single source of truth
    const maxScore = getMaxScore(gameId);
    if (score > maxScore) {
        result.errors.push(`Score exceeds maximum for ${gameId}`);
        return result;
    }
    
    result.valid = true;
    result.sanitizedScore = Math.floor(score);
    return result;
}

/**
 * Create a safe HTML element from text
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @param {object} attributes - HTML attributes
 * @returns {HTMLElement} - Safe element
 */
export function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    element.textContent = text; // Automatically escapes HTML
    
    Object.entries(attributes).forEach(([key, value]) => {
        // Only allow safe attributes
        const safeAttrs = ['class', 'id', 'data-id', 'role', 'aria-label'];
        if (safeAttrs.includes(key)) {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize URL to prevent javascript: injection
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Safe URL or null
 */
export function sanitizeURL(url) {
    if (typeof url !== 'string') return null;
    
    const trimmed = url.trim().toLowerCase();
    
    // Block javascript: and data: protocols
    if (trimmed.startsWith('javascript:') || 
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:')) {
        return null;
    }
    
    // Only allow http:, https:, mailto:, tel:
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    const hasAllowedProtocol = allowedProtocols.some(protocol => 
        trimmed.startsWith(protocol)
    );
    
    // If no protocol, assume https
    if (!hasAllowedProtocol && !trimmed.includes(':')) {
        return 'https://' + url;
    }
    
    return hasAllowedProtocol ? url : null;
}

export default {
    sanitizeHTML,
    sanitizeForFirebase,
    sanitizeDisplayName,
    sanitizeChatMessage,
    validateScore,
    createSafeElement,
    escapeRegExp,
    sanitizeURL
};
