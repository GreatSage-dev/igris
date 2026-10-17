import fs from 'fs';
import https from 'https';
import path from 'path';

const apiKey = 'sk_b88c31298e127ba997269569b41c9bce4566bde856ca23e5';
const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam (verified)

const scenes = [
  {
    name: 'scene1_crisis',
    text: 'In 2026, autonomous AI coding agents produce thousands of pull requests per minute. But eighty-four percent of bug bounty submissions are now hallucinated AI slop, burning millions in cloud compute on phantom CVEs.'
  },
  {
    name: 'scene2_gatekeeper',
    text: 'Meet Igris: the autonomous post-code DevSecOps gatekeeper for GitLab Duo. A zero-trust blast chamber delivering sub-second deterministic receipts before a single runner CPU cycle is wasted.'
  },
  {
    name: 'scene3_cascade',
    text: 'Watch the cascade execute: Gate Zero validates schemas in point-eight milliseconds. Gate One scans repository AST, catching hallucinated functions in three-point-six milliseconds. Zero compute burned. Eighteen thousand dollars protected.'
  },
  {
    name: 'scene4_bisect',
    text: 'When a genuine exception occurs, Gate Three triggers automated Git Bisection, resolving GitLab Community Issue 989 after seven years of requests. It binary searches the commit tree and isolates the breaking commit in under one hundred and fifty milliseconds.'
  },
  {
    name: 'scene5_proof_cta',
    text: 'Every execution concludes with an immutable, tamper-proof SHA-256 evidence receipt. Deploy post-code defense in one line with gitlab-ci.yml. Igris: Verifiable security for the AI era.'
  }
];

const outDir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generateVoice(scene) {
  const filePath = path.join(outDir, scene.name + '.mp3');
  console.log(`[ElevenLabs] Generating audio for: ${scene.name} (${scene.text.length} chars)...`);
  
  const postData = JSON.stringify({
    text: scene.text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.82
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode === 200) {
          fs.writeFileSync(filePath, buf);
          console.log(`✔ [ElevenLabs] Saved: ${scene.name}.mp3 (${buf.length.toLocaleString()} bytes)`);
          resolve(filePath);
        } else {
          console.error(`✖ Failed for ${scene.name}:`, res.statusCode, buf.toString());
          reject(new Error(buf.toString()));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('=== ElevenLabs Full Voiceover Generation ===');
  for (const scene of scenes) {
    await generateVoice(scene);
    await new Promise(r => setTimeout(r, 600)); // Pacing
  }
  console.log('=== All 5 scene audio tracks generated successfully! ===');
})();
