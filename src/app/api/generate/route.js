
// export async function POST(req) {
//   function toHashtag(word) {
//     const cleaned = word
//       .toLowerCase()
//       .replace(/[#]/g, "")
//       .replace(/[^a-z0-9_]+/g, "");
//     if (!cleaned) return "";
//     return `#${cleaned}`;
//   }

//   function extractHashtags(raw, limit) {
//     const chunks = raw
//       .split(/[,|\n]/g)
//       .flatMap(x => x.split(" "))
//       .map(x => x.trim())
//       .filter(Boolean);

//     const tags = [];
//     const seen = new Set();

//     for (const c of chunks) {
//       const tag = toHashtag(c);
//       if (tag && !seen.has(tag)) {
//         seen.add(tag);
//         tags.push(tag);
//         if (tags.length >= limit) break;
//       }
//     }

//     if (tags.length === 0) {
//       const words = raw
//         .toLowerCase()
//         .replace(/[^a-z0-9_\s]+/g, " ")
//         .split(/\s+/)
//         .filter(Boolean);
//       for (const w of words) {
//         const tag = toHashtag(w);
//         if (tag && !seen.has(tag)) {
//           seen.add(tag);
//           tags.push(tag);
//           if (tags.length >= limit) break;
//         }
//       }
//     }
//     return tags.slice(0, limit);
//   }

//   try {
//     const body = await req.json();
//     const keywords = (body.keywords || "").trim();
//     const count = Number(body.count ?? 12);
//     const model = body.model?.trim() || process.env.OLLAMA_MODEL || "gemma:2b";

//     if (!keywords) {
//       return new Response(
//         JSON.stringify({ error: "Please provide some keywords/topic text." }),
//         { status: 400 }
//       );
//     }

//     const prompt = `
// You are a social media assistant. Given a post topic, return ONLY a comma-separated list of ${count} short, trending, relevant hashtags.
// No explanations. No numbering. No extra text.

// Topic: ${keywords}
// `;

//     const host = process.env.OLLAMA_HOST || "http://localhost:11434";
//     const resp = await fetch(`${host}/api/generate`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ model, prompt, stream: false }),
//     });

//     if (!resp.ok) {
//       const text = await resp.text();
//       return new Response(
//         JSON.stringify({
//           error: `Ollama error: ${resp.status} ${resp.statusText}`,
//           details: text,
//         }),
//         { status: 502 }
//       );
//     }

//     const data = await resp.json();
//     const raw = data?.response ?? "";
//     const hashtags = extractHashtags(raw, count);

//     if (hashtags.length === 0) {
//       return new Response(
//         JSON.stringify({
//           error: "Model returned no usable hashtags. Try different keywords.",
//         }),
//         { status: 500 }
//       );
//     }

//     return new Response(JSON.stringify({ hashtags, modelUsed: model }), {
//       status: 200,
//     });
//   } catch (err) {
//     return new Response(
//       JSON.stringify({
//         error: "Server error",
//         details: err?.message ?? String(err),
//       }),
//       { status: 500 }
//     );
//   }
// }

export async function POST(req) {
  function extractHashtags(raw, limit) {
    const stopwords = new Set([
      "the", "and", "are", "here", "sure", "related", "topic",
      "to", "for", "of", "in", "on", "at", "by", "an", "a",
      "hashtags", "short", "trending", "relevant", "requested"
    ]);

    const chunks = raw
      .split(/[,|\n]/g)
      .flatMap(x => x.split(" "))
      .map(x => x.trim())
      .filter(Boolean);

    const tags = [];
    const seen = new Set();

    for (const c of chunks) {
      let cleaned = c.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, "");

      if (
        !cleaned ||
        stopwords.has(cleaned) ||          // 🚫 skip junk/meta words
        /^[0-9]+$/.test(cleaned) ||        // 🚫 skip pure numbers
        cleaned.length < 3 ||              // 🚫 too short
        seen.has(cleaned)
      ) continue;

      const tag = `#${cleaned}`;
      seen.add(cleaned);
      tags.push(tag);

      if (tags.length >= limit) break;
    }

    return tags.slice(0, limit);
  }

  try {
    const body = await req.json();
    const keywords = (body.keywords || "").trim();
    const count = Number(body.count ?? 12);
    const model = body.model?.trim() || process.env.OLLAMA_MODEL || "gemma:2b";

    if (!keywords) {
      return new Response(
        JSON.stringify({ error: "Please provide some keywords/topic text." }),
        { status: 400 }
      );
    }

    const prompt = `
You are a social media assistant.
Return ONLY a comma-separated list of ${count} unique, short, catchy hashtags directly related to the topic below.  

⚠️ Rules:
- Only hashtags (with #).
- No explanations, no numbering, no sentences.
- No filler/meta words like "hashtags", "short", "trending", "relevant", "requested".
- No common words like "the", "here", "are", "to", "for".
- Each hashtag must be a real, popular social media tag related to the topic.
- Do not include numbers or meaningless words.

Topic: ${keywords}
`;

    const host = process.env.OLLAMA_HOST || "http://localhost:11434";
    const resp = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({
          error: `Ollama error: ${resp.status} ${resp.statusText}`,
          details: text,
        }),
        { status: 502 }
      );
    }

    const data = await resp.json();
    const raw = data?.response ?? "";
    const hashtags = extractHashtags(raw, count);

    if (hashtags.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Model returned no usable hashtags. Try different keywords.",
        }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ hashtags, modelUsed: model }), {
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
