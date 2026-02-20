/**
 * DIRECT BACKUP SERVICE — EduNorm
 * Zero-complexity, zero-data-loss cloud backup to Firestore.
 *
 * DESIGN PHILOSOPHY:
 *   - NO encryption middleware (Firestore security rules handle auth)
 *   - NO tri-layer requirements (1 layer = Firestore = enough)
 *   - NO complex mapping (data is stored as-is + restored as-is)
 *   - Chunked writes so Firestore 1MB doc limit is never hit
 *   - Idempotent: sync twice = same result, no duplicates
 */

import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '../config/firebase.js';
import { exportAllData, importAllData } from './database.js';

// Firestore path: backups/{userId}/chunks/{0,1,2,...}
const COLLECTION = 'backups';
const META_DOC = 'meta';
const CHUNKS_SUB = 'chunks';
const CHUNK_SIZE = 200; // students per chunk (well under 1MB limit)

// ─── Auth helper ────────────────────────────────────────────────────────────
function getAuth() {
    if (!isFirebaseConfigured || !firestoreDb) {
        throw new Error('Firebase is not configured. Check your .env VITE_FIREBASE_* variables.');
    }
    return firestoreDb;
}

// ─── SYNC (Local → Cloud) ───────────────────────────────────────────────────
export async function syncToCloud(userId) {
    if (!userId) throw new Error('Must be logged in to sync');
    const db = getAuth();

    console.log('📤 DirectBackup: Starting sync for user', userId);

    const data = await exportAllData();
    const students = data.students || [];
    const settings = data.settings || [];
    const standards = data.standards || [];
    const customFields = data.customFields || [];

    // Split students into chunks
    const chunks = [];
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
        chunks.push(students.slice(i, i + CHUNK_SIZE));
    }

    const userRef = (path) => doc(db, COLLECTION, userId, path);

    // 1. Write non-student data to meta doc
    await setDoc(doc(db, COLLECTION, userId, META_DOC, 'data'), {
        settings,
        standards,
        customFields,
        totalStudents: students.length,
        totalChunks: chunks.length,
        syncedAt: new Date().toISOString(),
        version: 1,
    });

    // 2. Write student chunks (batched for performance)
    const chunksRef = collection(db, COLLECTION, userId, CHUNKS_SUB);

    // Delete old chunks first to avoid stale data
    const oldChunks = await getDocs(chunksRef);
    if (!oldChunks.empty) {
        const batch = writeBatch(db);
        oldChunks.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }

    // Write new chunks
    for (let i = 0; i < chunks.length; i++) {
        await setDoc(doc(chunksRef, String(i)), { students: chunks[i], chunkIndex: i });
        console.log(`📤 DirectBackup: chunk ${i + 1}/${chunks.length} written`);
    }

    const total = settings.length + standards.length + customFields.length + students.length;
    console.log(`✅ DirectBackup: sync complete — ${total} records (${students.length} students in ${chunks.length} chunks)`);
    return { synced: total, students: students.length, chunks: chunks.length };
}

// ─── RESTORE (Cloud → Local) ─────────────────────────────────────────────────
export async function restoreFromCloud(userId) {
    if (!userId) throw new Error('Must be logged in to restore');
    const db = getAuth();

    console.log('📥 DirectBackup: Starting restore for user', userId);

    // 1. Read meta doc
    const metaSnap = await getDoc(doc(db, COLLECTION, userId, META_DOC, 'data'));
    if (!metaSnap.exists()) {
        console.log('📥 DirectBackup: No backup found in cloud');
        return { restored: 0, students: 0, found: false };
    }

    const meta = metaSnap.data();
    const { settings = [], standards = [], customFields = [], totalChunks = 0 } = meta;

    // 2. Read all student chunks
    const students = [];
    const chunksRef = collection(db, COLLECTION, userId, CHUNKS_SUB);
    const chunksSnap = await getDocs(chunksRef);

    // Sort chunks by index to maintain order
    const sortedChunks = chunksSnap.docs.sort((a, b) => {
        return (a.data().chunkIndex || 0) - (b.data().chunkIndex || 0);
    });

    for (const chunkDoc of sortedChunks) {
        const chunkData = chunkDoc.data();
        if (Array.isArray(chunkData.students)) {
            students.push(...chunkData.students);
        }
    }

    console.log(`📥 DirectBackup: found ${students.length} students, ${settings.length} settings, ${standards.length} standards`);

    // 3. Import into local IndexedDB
    await importAllData({ students, settings, standards, customFields });

    const total = students.length + settings.length + standards.length + customFields.length;
    console.log(`✅ DirectBackup: restore complete — ${total} records imported`);
    return { restored: total, students: students.length, found: true };
}

// ─── STATUS CHECK ─────────────────────────────────────────────────────────────
export async function getCloudBackupStatus(userId) {
    if (!userId || !isFirebaseConfigured || !firestoreDb) {
        return { exists: false, configured: isFirebaseConfigured };
    }
    try {
        const metaSnap = await getDoc(doc(firestoreDb, COLLECTION, userId, META_DOC, 'data'));
        if (!metaSnap.exists()) return { exists: false, configured: true };
        const meta = metaSnap.data();
        return {
            exists: true,
            configured: true,
            syncedAt: meta.syncedAt,
            totalStudents: meta.totalStudents || 0,
            totalChunks: meta.totalChunks || 0,
        };
    } catch (e) {
        return { exists: false, configured: true, error: e.message };
    }
}
