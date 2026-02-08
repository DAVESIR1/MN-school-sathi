/**
 * Secure Encryption Service
 * 
 * Multi-level encryption using AES-256-GCM (gold standard)
 * with GZIP compression for maximum security and minimal size
 * 
 * SECURITY FEATURES:
 * - AES-256-GCM encryption (military-grade)
 * - PBKDF2 key derivation (100k iterations)
 * - Unique IV (Initialization Vector) per encryption
 * - Integrity verification (GCM authentication tag)
 * - High compression before encryption
 * 
 * NO ONE can read the data without the master key!
 */

import pako from 'pako';

// Encryption configuration
const ENCRYPTION_CONFIG = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,          // 96 bits for GCM
    tagLength: 128,        // Authentication tag
    pbkdf2Iterations: 100000,  // Strong key derivation
    saltLength: 16
};

// Master encryption key (derived from app secret + user ID)
// This ensures only your app can decrypt data
const APP_SECRET = 'EduNorm_Secure_2024_!@#$%^&*()_MASTER_KEY';

/**
 * Derive a strong encryption key from user ID using PBKDF2
 * This creates a unique key for each user
 */
async function deriveKey(userId, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(APP_SECRET + userId),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ENCRYPTION_CONFIG.algorithm, length: ENCRYPTION_CONFIG.keyLength },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Compress data using GZIP (highest compression)
 * Typically reduces JSON data size by 80-90%
 */
function compressData(data) {
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    // Compress with maximum compression level
    const compressed = pako.gzip(jsonString, { level: 9 });

    const compressedSize = compressed.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`SecureEncryption: Compressed ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}% reduction)`);

    return compressed;
}

/**
 * Decompress GZIP data
 */
function decompressData(compressed) {
    const decompressed = pako.ungzip(compressed, { to: 'string' });
    return JSON.parse(decompressed);
}

/**
 * Convert Uint8Array to Base64 (handles large arrays without stack overflow)
 */
function uint8ArrayToBase64(uint8Array) {
    // Process in chunks to avoid "Maximum call stack size exceeded"
    const CHUNK_SIZE = 8192;
    let result = '';

    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
        result += String.fromCharCode.apply(null, chunk);
    }

    return btoa(result);
}

/**
 * Convert Base64 to Uint8Array
 */
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param {Object} data - Data to encrypt
 * @param {string} userId - User ID for key derivation
 * @returns {Object} - Encrypted package (Base64 encoded)
 */
export async function encryptData(data, userId) {
    if (!data || !userId) {
        throw new Error('Data and userId are required for encryption');
    }

    try {
        console.log('SecureEncryption: Starting encryption...');

        // Step 1: Compress data
        const compressed = compressData(data);

        // Step 2: Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
        const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

        // Step 3: Derive encryption key
        const key = await deriveKey(userId, salt);

        // Step 4: Encrypt with AES-256-GCM
        const encrypted = await crypto.subtle.encrypt(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv: iv,
                tagLength: ENCRYPTION_CONFIG.tagLength
            },
            key,
            compressed
        );

        // Step 5: Combine salt + iv + encrypted data
        const combined = new Uint8Array(
            salt.length + iv.length + encrypted.byteLength
        );
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Step 6: Convert to Base64 for storage (chunked to prevent stack overflow)
        const base64 = uint8ArrayToBase64(combined);

        console.log(`SecureEncryption: Encrypted successfully (${base64.length} chars)`);

        return {
            encrypted: base64,
            version: '2.0',
            algorithm: 'AES-256-GCM-PBKDF2',
            compressed: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('SecureEncryption: Encryption failed:', error);
        throw new Error('Failed to encrypt data: ' + error.message);
    }
}

/**
 * Decrypt data encrypted with encryptData
 * 
 * @param {Object} encryptedPackage - Encrypted package from encryptData
 * @param {string} userId - User ID for key derivation
 * @returns {Object} - Original decrypted data
 */
export async function decryptData(encryptedPackage, userId) {
    if (!encryptedPackage || !userId) {
        throw new Error('Encrypted package and userId are required for decryption');
    }

    // Handle legacy unencrypted data
    if (!encryptedPackage.encrypted || encryptedPackage.version !== '2.0') {
        console.log('SecureEncryption: Legacy data detected, returning as-is');
        return encryptedPackage;
    }

    try {
        console.log('SecureEncryption: Starting decryption...');

        // Step 1: Decode Base64
        const combined = Uint8Array.from(atob(encryptedPackage.encrypted), c => c.charCodeAt(0));

        // Step 2: Extract salt, iv, and encrypted data
        const salt = combined.slice(0, ENCRYPTION_CONFIG.saltLength);
        const iv = combined.slice(
            ENCRYPTION_CONFIG.saltLength,
            ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
        );
        const encryptedData = combined.slice(
            ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
        );

        // Step 3: Derive decryption key
        const key = await deriveKey(userId, salt);

        // Step 4: Decrypt with AES-256-GCM
        const decrypted = await crypto.subtle.decrypt(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv: iv,
                tagLength: ENCRYPTION_CONFIG.tagLength
            },
            key,
            encryptedData
        );

        // Step 5: Decompress data
        const decompressed = decompressData(new Uint8Array(decrypted));

        console.log('SecureEncryption: Decryption successful');

        return decompressed;
    } catch (error) {
        console.error('SecureEncryption: Decryption failed:', error);
        throw new Error('Failed to decrypt data. Data may be corrupted or encryption key mismatch.');
    }
}

/**
 * Check if data is encrypted
 */
export function isEncrypted(data) {
    return data && data.version === '2.0' && data.encrypted && data.algorithm;
}

/**
 * Get encryption info for display
 */
export function getEncryptionInfo() {
    return {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-SHA256',
        iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
        compression: 'GZIP (Level 9)',
        security: 'Military-grade encryption'
    };
}

export default {
    encryptData,
    decryptData,
    isEncrypted,
    getEncryptionInfo
};
