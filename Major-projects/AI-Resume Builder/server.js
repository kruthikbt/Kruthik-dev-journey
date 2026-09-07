const http = require('http');
const fs = require('fs');
const path = require('path');

// ===== MANUALLY PARSE .ENV FILE (Zero Dependencies!) =====
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf8');
    envData.split(/\r?\n/).forEach(line => {
      // Remove comments and trim whitespace
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, ''); // strip optional quotes
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (err) {
  console.error("Error reading or parsing .env file:", err);
}

const PORT = process.env.PORT || 3000;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function splitEnteredList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  return cleanText(value)
    .split(/[\n,;]+/)
    .map(cleanText)
    .filter(Boolean);
}

function sanitizeResume(resume, userData) {
  const personal = userData?.personal || {};
  const enteredSkills = userData?.skills || {};
  const enteredExperience = Array.isArray(userData?.experience) ? userData.experience : [];
  const enteredEducation = Array.isArray(userData?.education) ? userData.education : [];

  const contact = {};
  ['email', 'phone', 'location', 'linkedin', 'website'].forEach(field => {
    const value = cleanText(personal[field]);
    if (value) contact[field] = value;
  });

  return {
    name: cleanText(personal.name) || cleanText(resume?.name),
    title: cleanText(personal.title),
    contact,
    summary: cleanText(personal.summary) ? cleanText(resume?.summary) || cleanText(personal.summary) : '',
    skills: {
      technical: splitEnteredList(enteredSkills.technical),
      soft: splitEnteredList(enteredSkills.soft),
      tools: splitEnteredList(enteredSkills.tools),
      certifications: splitEnteredList(enteredSkills.certifications),
      languages: splitEnteredList(enteredSkills.languages)
    },
    experience: enteredExperience
      .filter(item => cleanText(item.title) || cleanText(item.company) || cleanText(item.desc))
      .map((item, index) => {
        const aiItem = Array.isArray(resume?.experience) ? resume.experience[index] || {} : {};
        const start = cleanText(item.start);
        const end = cleanText(item.end);
        const duration = start && end ? `${start} - ${end}` : start || end;

        const bullets = splitEnteredList(aiItem.bullets);

        return {
          title: cleanText(item.title),
          company: cleanText(item.company),
          duration,
          location: cleanText(item.loc),
          bullets: cleanText(item.desc) ? (bullets.length ? bullets : splitEnteredList(item.desc)) : []
        };
      }),
    education: enteredEducation
      .filter(item => cleanText(item.degree) || cleanText(item.school))
      .map(item => ({
        degree: cleanText(item.degree),
        school: cleanText(item.school),
        year: cleanText(item.year),
        gpa: cleanText(item.gpa),
        honors: cleanText(item.notes)
      }))
  };
}

const server = http.createServer(async (req, res) => {
  // CORS Headers (in case local testing is done across ports)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET / or /index.html: Serve static frontend
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      const htmlPath = path.join(__dirname, 'index.html');
      const data = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: Unable to read index.html');
    }
    return;
  }

  if (req.method === 'GET' && (req.url === '/styles.css' || req.url === '/app.js')) {
    try {
      const staticPath = path.join(__dirname, req.url.slice(1));
      const contentType = req.url.endsWith('.css') ? 'text/css' : 'application/javascript';
      const data = fs.readFileSync(staticPath, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
      res.end(data);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
    return;
  }

  // POST /api/generate-resume: Secure proxy to Gemini API
  if (req.method === 'POST' && req.url === '/api/generate-resume') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { userData, model } = payload;
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || !apiKey.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: { message: "GEMINI_API_KEY is not configured in the server's .env file." }
          }));
          return;
        }

        const prompt = `You are a professional resume writer with 20 years of experience. Create a comprehensive, ATS-optimized resume for the following person.

PERSON'S INFORMATION:
${JSON.stringify(userData, null, 2)}

Generate a complete, professional resume. Return ONLY valid JSON in this exact structure:
{
  "name": "Full Name",
  "title": "Professional Title",
  "contact": { "email": "...", "phone": "...", "location": "...", "linkedin": "...", "website": "..." },
  "summary": "3-4 sentence compelling professional summary tailored to their background and target role",
  "skills": { "technical": ["skill1","skill2",...], "soft": ["skill1","skill2",...], "tools": ["tool1","tool2",...], "certifications": ["cert1",...], "languages": ["lang1",...] },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start – End",
      "location": "Location",
      "bullets": ["Achieved X resulting in Y% improvement", "Led team of N to deliver Z on time and budget", "..."]
    }
  ],
  "education": [
    { "degree": "Degree", "school": "School", "year": "Year", "gpa": "GPA if provided", "honors": "honors/courses" }
  ]
}

Rules:
- Do not invent names, contact details, job titles, employers, education, skills, certifications, languages, dates, locations, projects, awards, or metrics.
- If the user did not enter a field or section, return an empty string or empty array for that field.
- Do not add placeholder/default/sample values such as "example.com", "Company Name", "Bachelor's Degree", "Project Manager", or fake phone numbers.
- Only create resume bullets from responsibilities and achievements the user provided.
- Write 3-5 powerful, quantified bullet points per experience (use numbers/percentages where possible)
- Professional summary should be compelling and tailored to the ${userData.preferences.tone} tone only when the user entered summary/background details
- Extract and organize skills only from the skills the user entered
- Make bullets start with strong action verbs
- Keep everything factual and based on the provided information`;

        const responseSchema = {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Full Name of the candidate" },
            title: { type: "STRING", description: "Professional Title of the candidate" },
            contact: {
              type: "OBJECT",
              properties: {
                email: { type: "STRING" },
                phone: { type: "STRING" },
                location: { type: "STRING" },
                linkedin: { type: "STRING" },
                website: { type: "STRING" }
              },
              required: []
            },
            summary: { type: "STRING", description: "3-4 sentence professional summary" },
            skills: {
              type: "OBJECT",
              properties: {
                technical: { type: "ARRAY", items: { type: "STRING" } },
                soft: { type: "ARRAY", items: { type: "STRING" } },
                tools: { type: "ARRAY", items: { type: "STRING" } },
                certifications: { type: "ARRAY", items: { type: "STRING" } },
                languages: { type: "ARRAY", items: { type: "STRING" } }
              }
            },
            experience: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  company: { type: "STRING" },
                  duration: { type: "STRING" },
                  location: { type: "STRING" },
                  bullets: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["title", "company"]
              }
            },
            education: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  degree: { type: "STRING" },
                  school: { type: "STRING" },
                  year: { type: "STRING" },
                  gpa: { type: "STRING" },
                  honors: { type: "STRING" }
                },
                required: ["degree", "school"]
              }
            }
          },
          required: ["name", "contact", "skills", "experience", "education"]
        };

        const targetModel = model || 'gemini-2.5-flash';

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          })
        });

        if (!geminiRes.ok) {
          const errData = await geminiRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP error ${geminiRes.status}`;
          res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: errMsg } }));
          return;
        }

        const data = await geminiRes.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const generatedResume = JSON.parse(raw);
          data.candidates[0].content.parts[0].text = JSON.stringify(sanitizeResume(generatedResume, userData));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error("Server-side request error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: "Internal server error: " + err.message } }));
      }
    });
    return;
  }

  // Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 AI Resume Builder Local Server Running!`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`🔒 Gemini API Key loaded from .env file`);
  console.log(`==================================================`);
});
