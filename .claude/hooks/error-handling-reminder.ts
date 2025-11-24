#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
    hook_event_name: string;
}

interface EditedFile {
    path: string;
    tool: string;
    timestamp: string;
}

interface SessionTracking {
    edited_files: EditedFile[];
}

function getFileCategory(filePath: string): 'backend' | 'database' | 'other' {
    // Backend detection (NestJS structure)
    if (filePath.includes('/src/') &&
        (filePath.endsWith('.controller.ts') ||
         filePath.endsWith('.service.ts') ||
         filePath.endsWith('.module.ts') ||
         filePath.endsWith('.guard.ts') ||
         filePath.endsWith('.interceptor.ts') ||
         filePath.endsWith('.pipe.ts') ||
         filePath.endsWith('.filter.ts'))) return 'backend';

    // Database detection
    if (filePath.includes('/prisma/') ||
        filePath.includes('/migrations/') ||
        filePath.endsWith('.entity.ts') ||
        filePath.endsWith('.repository.ts')) return 'database';

    return 'other';
}

function shouldCheckErrorHandling(filePath: string): boolean {
    // Skip test files, config files, and type definitions
    if (filePath.match(/\.(test|spec)\.(ts|tsx)$/)) return false;
    if (filePath.match(/\.(config|d)\.(ts|tsx)$/)) return false;
    if (filePath.includes('types/')) return false;
    if (filePath.includes('.styles.ts')) return false;

    // Check for code files
    return filePath.match(/\.(ts|tsx|js|jsx)$/) !== null;
}

function analyzeFileContent(filePath: string): {
    hasTryCatch: boolean;
    hasAsync: boolean;
    hasPrisma: boolean;
    hasController: boolean;
    hasHttpException: boolean;
} {
    if (!existsSync(filePath)) {
        return { hasTryCatch: false, hasAsync: false, hasPrisma: false, hasController: false, hasHttpException: false };
    }

    const content = readFileSync(filePath, 'utf-8');

    return {
        hasTryCatch: /try\s*\{/.test(content),
        hasAsync: /async\s+/.test(content),
        hasPrisma: /prisma\.|PrismaService|InjectRepository|findMany|findOne|create\(|update\(|delete\(/i.test(content),
        hasController: /@Controller\(|export class.*Controller/.test(content),
        hasHttpException: /throw new.*Exception|HttpException|BadRequestException|NotFoundException/i.test(content),
    };
}

async function main() {
    try {
        // Read input from stdin
        const input = readFileSync(0, 'utf-8');
        const data: HookInput = JSON.parse(input);

        const { session_id } = data;
        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

        // Check for edited files tracking
        const cacheDir = join(process.env.HOME || '/root', '.claude', 'tsc-cache', session_id);
        const trackingFile = join(cacheDir, 'edited-files.log');

        if (!existsSync(trackingFile)) {
            // No files edited this session, no reminder needed
            process.exit(0);
        }

        // Read tracking data
        const trackingContent = readFileSync(trackingFile, 'utf-8');
        const editedFiles = trackingContent
            .trim()
            .split('\n')
            .filter(line => line.length > 0)
            .map(line => {
                const [timestamp, tool, path] = line.split('\t');
                return { timestamp, tool, path };
            });

        if (editedFiles.length === 0) {
            process.exit(0);
        }

        // Categorize files
        const categories = {
            backend: [] as string[],
            database: [] as string[],
            other: [] as string[],
        };

        const analysisResults: Array<{
            path: string;
            category: string;
            analysis: ReturnType<typeof analyzeFileContent>;
        }> = [];

        for (const file of editedFiles) {
            if (!shouldCheckErrorHandling(file.path)) continue;

            const category = getFileCategory(file.path);
            categories[category].push(file.path);

            const analysis = analyzeFileContent(file.path);
            analysisResults.push({ path: file.path, category, analysis });
        }

        // Check if any code that needs error handling was written
        const needsAttention = analysisResults.some(
            ({ analysis }) =>
                analysis.hasTryCatch ||
                analysis.hasAsync ||
                analysis.hasPrisma ||
                analysis.hasController ||
                analysis.hasHttpException
        );

        if (!needsAttention) {
            // No risky code patterns detected, skip reminder
            process.exit(0);
        }

        // Display reminder
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ERROR HANDLING SELF-CHECK');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Backend reminders (NestJS)
        if (categories.backend.length > 0) {
            const backendFiles = analysisResults.filter(f => f.category === 'backend');
            const hasTryCatch = backendFiles.some(f => f.analysis.hasTryCatch);
            const hasPrisma = backendFiles.some(f => f.analysis.hasPrisma);
            const hasController = backendFiles.some(f => f.analysis.hasController);
            const hasHttpException = backendFiles.some(f => f.analysis.hasHttpException);

            console.log('⚠️  Backend Changes Detected (NestJS)');
            console.log(`   ${categories.backend.length} file(s) edited\n`);

            if (hasTryCatch) {
                console.log('   ❓ Did you add proper error logging in catch blocks?');
            }
            if (hasPrisma) {
                console.log('   ❓ Are database operations wrapped in try-catch?');
            }
            if (hasController) {
                console.log('   ❓ Do controllers have proper exception filters?');
            }
            if (hasHttpException) {
                console.log('   ❓ Are HTTP exceptions appropriate for the error type?');
            }

            console.log('\n   💡 NestJS Best Practices:');
            console.log('      - Use built-in exception filters (@Catch decorator)');
            console.log('      - Throw appropriate HTTP exceptions (BadRequestException, etc.)');
            console.log('      - Log errors with proper context (Logger service)');
            console.log('      - Consider using interceptors for consistent error handling\n');
        }

        // Database reminders
        if (categories.database.length > 0) {
            console.log('🗄️  Database Changes Detected');
            console.log(`   ${categories.database.length} file(s) edited\n`);
            console.log('   ❓ Did you verify column names against schema?');
            console.log('   ❓ Are migrations tested?\n');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 TIP: Disable with SKIP_ERROR_REMINDER=1');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (err) {
        // Silently fail - this is just a reminder, not critical
        process.exit(0);
    }
}

main().catch(() => process.exit(0));
