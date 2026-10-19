import { execSync } from 'node:child_process';
/**
 * Gate 3: Automated Git Bisection Engine
 * Solves GitLab Community Issue #989: "Automated git bisect"
 * When a vulnerability or regression is proven in G2, this engine binary-searches
 * git history to locate the exact commit and author that introduced the flaw.
 */
export function runAutomatedBisection(repoRoot, goodCommitSha, reproCommand) {
    try {
        // 1. Verify git repo exists
        execSync('git rev-parse --is-inside-work-tree', { cwd: repoRoot, stdio: 'ignore' });
        // 2. Run git bisect automated sequence
        execSync('git bisect reset', { cwd: repoRoot, stdio: 'ignore' });
        execSync('git bisect start', { cwd: repoRoot, stdio: 'ignore' });
        execSync('git bisect bad HEAD', { cwd: repoRoot, stdio: 'ignore' });
        execSync(`git bisect good ${goodCommitSha}`, { cwd: repoRoot, stdio: 'ignore' });
        // 3. Execute automated bisect run
        const bisectOutput = execSync(`git bisect run ${reproCommand}`, {
            cwd: repoRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        // 4. Parse first bad commit SHA
        const match = bisectOutput.match(/([a-f0-9]{7,40}) is the first bad commit/);
        const culpritSha = match ? match[1] : '';
        if (!culpritSha) {
            execSync('git bisect reset', { cwd: repoRoot, stdio: 'ignore' });
            return null;
        }
        // 5. Extract commit metadata
        const author = execSync(`git log -1 --format="%an <%ae>" ${culpritSha}`, { cwd: repoRoot, encoding: 'utf-8' }).trim();
        const date = execSync(`git log -1 --format="%ad" --date=short ${culpritSha}`, { cwd: repoRoot, encoding: 'utf-8' }).trim();
        const message = execSync(`git log -1 --format="%s" ${culpritSha}`, { cwd: repoRoot, encoding: 'utf-8' }).trim();
        // Reset bisect state back to normal
        execSync('git bisect reset', { cwd: repoRoot, stdio: 'ignore' });
        return {
            culpritCommitSha: culpritSha,
            commitAuthor: author,
            commitDate: date,
            commitMessage: message,
            stepsCount: (bisectOutput.match(/Bisecting:/g) || []).length + 1,
            reproductionCommand: reproCommand
        };
    }
    catch {
        // If bisect fails (e.g., shallow clone or single commit), reset cleanly and return null
        try {
            execSync('git bisect reset', { cwd: repoRoot, stdio: 'ignore' });
        }
        catch {
            // ignore
        }
        return null;
    }
}
//# sourceMappingURL=g3_bisect.js.map