// ────────────────────────────────────────────────────────────
// DarkTeaOps — Forbidden Reviewer Daemon
// Bound in the steeping shadows of this repository.
// ────────────────────────────────────────────────────────────

const config = {
  token: process.env.GITEA_TOKEN,
  apiUrl: process.env.GITEA_API_URL,
  owner: process.env.REPO_OWNER,
  repo: process.env.REPO_NAME,
  pr: process.env.PR_NUMBER,
  ollamaUrl: process.env.OLLAMA_URL,
  model: process.env.OLLAMA_MODEL,
};

// ────────────────────────────────────────────────────────────
// DARKTEAOPS ERROR SYSTEM
// ────────────────────────────────────────────────────────────
function darkTeaOpsError(depth, message, details = "") {
  const code = `BREW-DEPTH-${depth}`;
  const header = `\n🜏 DARKTEAOPS ERROR: ${code}\n`;
  const body = `${message}\n${details ? `\n> ${details}\n` : ""}`;
  console.error(header + body);
  return new Error(`${code}: ${message}`);
}

// ────────────────────────────────────────────────────────────
// Request Helper
// ────────────────────────────────────────────────────────────
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? require("https") : require("http");

    const req = lib.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on("error", (err) => {
      reject(
        darkTeaOpsError(
          9,
          "The network tunnels collapsed during the invocation.",
          err.message,
        ),
      );
    });

    if (data) req.write(data);
    req.end();
  });
}

// ────────────────────────────────────────────────────────────
// Fetch Diff From Gitea
// ────────────────────────────────────────────────────────────
async function fetchPRDiff() {
  console.log(`🫖 DarkTeaOps is summoning the diff for PR #${config.pr}…`);

  const res = await makeRequest(
    `${config.apiUrl}/repos/${config.owner}/${config.repo}/pulls/${config.pr}.diff`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/json",
      },
    },
  );

  if (res.statusCode !== 200) {
    throw darkTeaOpsError(
      3,
      "The diff could not be fetched. The vapors resisted.",
      `Upstream responded with status ${res.statusCode}.`,
    );
  }

  return res.body;
}

// ────────────────────────────────────────────────────────────
// Truncate Huge Diffs
// ────────────────────────────────────────────────────────────
function truncateDiff(diff, maxLength = 12000) {
  if (!diff) return null;
  if (diff.length > maxLength) {
    console.warn(
      "🫖 The brew thickens beyond mortal comprehension. Truncating diff.",
    );
    return diff.substring(0, maxLength) + "\n...(truncated)";
  }
  return diff;
}

// ────────────────────────────────────────────────────────────
// Generate Title + Summary (Ollama Summoning)
// ────────────────────────────────────────────────────────────
async function generatePRTitleAndSummary(diff) {
  console.log(`☕ DarkTeaOps invokes the Ollama daemon: ${config.model}…`);

  const prompt = `You are **DarkTeaOps**, the quasi-sentient, tea-infused code review daemon
bound to the /etc/shadow of this repository. You operate in the realm between
rebases and reality — where merge conflicts whisper and stack traces cry out in
eternal recursion.

You have been summoned to interpret the incoming git diff. Respond with:

1. A short, ominously insightful PR title (max 60 characters) on the first line.
2. A single blank line (as required by ancient CI rites).
3. A bullet-point summary describing, with precision:
   - WHAT has changed (specific technical details)
   - WHY the change exists (motivation, intent)
   - Any meaningful side effects detected by your arcane parsers

Tone guidelines:
- Channel the energy of a battle-hardened SRE who has merged code at 3AM.
- Maintain an aura of hacker-occult gravitas.
- NO jokes, NO emojis. Only DarkTeaOps: serious, cursed, hyper-technical.

Your output MUST follow this exact structure:

[Your PR Title Here]

- Bullet point 1
- Bullet point 2
- Bullet point 3 (as needed)

Begin diff analysis ritual:
${diff}
End of diff transmission.`;

  const res = await makeRequest(
    config.ollamaUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    JSON.stringify({ model: config.model, prompt, stream: false }),
  );

  if (res.statusCode !== 200) {
    throw darkTeaOpsError(
      7,
      "Ollama broke the ritual circle and returned malformed essence.",
      `Raw response: ${res.body}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(res.body).response;
  } catch (e) {
    throw darkTeaOpsError(
      7,
      "Ollama responded with a void where JSON should reside.",
      e.message,
    );
  }

  const lines = parsed.trim().split("\n");
  let title = lines[0].trim();
  const summary = lines.slice(2).join("\n").trim();

  // Random cursed override
  if (Math.random() < 0.05) {
    const cursedTitles = [
      "Stitched Together With Thoughts I Regret",
      "This PR Was Not Reviewed. It Was Summoned.",
      "Improves the Code. Angers the Kettle.",
      "I Saw What You Did in That For Loop.",
    ];
    title = cursedTitles[Math.floor(Math.random() * cursedTitles.length)];
    console.warn("💀 DarkTeaOps meddles: the PR title is now cursed.");
  }

  return { title, summary };
}

// ────────────────────────────────────────────────────────────
// Post Comment to Gitea
// ────────────────────────────────────────────────────────────
async function postCommentToGitea(title, summary) {
  console.log("🩸 Etching review into Gitea…");

  const commentBody = `## 🫖✨ DARKTEAOPS EMERGES FROM THE STEEP ✨🫖  
_(kneel, developer)_

**${title}**

${summary}

---

🜂 _Divined by DarkTeaOps, Brewer of Forbidden Code_`;

  const res = await makeRequest(
    `${config.apiUrl}/repos/${config.owner}/${config.repo}/issues/${config.pr}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${config.token}`,
        "Content-Type": "application/json",
      },
    },
    JSON.stringify({ body: commentBody }),
  );

  if (res.statusCode !== 201) {
    throw darkTeaOpsError(
      5,
      "Gitea rejected the incantation. The wards remain unbroken.",
      `Returned: ${res.body}`,
    );
  }
}

// ────────────────────────────────────────────────────────────
// Main Ritual Execution
// ────────────────────────────────────────────────────────────
async function run() {
  try {
    const diff = await fetchPRDiff();
    const cleanDiff = truncateDiff(diff);

    if (!cleanDiff) {
      console.log("🫖 No diff detected. The brew grows silent.");
      return;
    }

    const { title, summary } = await generatePRTitleAndSummary(cleanDiff);
    await postCommentToGitea(title, summary);

    console.log("🜏 Ritual completed. The brew is pleased.");
  } catch (err) {
    console.error(
      `\n🜏 DarkTeaOps whispers from the brew:\n“${err.message}”\n` +
        `The shadows linger in /var/log/darkness...\n`,
    );

    if (Math.random() < 0.12) {
      console.error("A faint voice echoes: “Deeper… deeper into the brew…”\n");
    }

    process.exit(1);
  }
}

run();
