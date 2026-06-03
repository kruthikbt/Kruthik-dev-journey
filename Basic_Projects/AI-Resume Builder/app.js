// ===== STATE =====
let currentStep = 0;
const totalSteps = 5;
let skills = [];
let experiences = [];
let educations = [];
let resumeText = '';
let currentResume = null;
let selectedTemplate = localStorage.getItem('resume_template') || 'template-1';

// ===== GEMINI API CONFIGURATION =====
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// ===== THEME =====
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-lbl');
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeLabel.textContent = isDark ? 'Light' : 'Dark';
});

// ===== SKILL TAGS =====
const skillInput = document.getElementById('skill-input');
const techTags = document.getElementById('tech-tags');
skillInput.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ',') && skillInput.value.trim()) {
    e.preventDefault();
    addSkill(skillInput.value.replace(',','').trim());
    skillInput.value = '';
  } else if (e.key === 'Backspace' && !skillInput.value && skills.length) {
    removeSkill(skills.length - 1);
  }
});
skillInput.addEventListener('focus', () => techTags.classList.add('focused'));
skillInput.addEventListener('blur', () => techTags.classList.remove('focused'));
function addSkill(s) {
  if (!s || skills.includes(s)) return;
  skills.push(s);
  renderSkills();
}
function removeSkill(i) {
  skills.splice(i, 1);
  renderSkills();
}
function renderSkills() {
  const tags = techTags.querySelectorAll('.skill-tag');
  tags.forEach(t => t.remove());
  skills.forEach((s, i) => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${s}<button onclick="removeSkill(${i})" aria-label="Remove">×</button>`;
    techTags.insertBefore(tag, skillInput);
  });
}

// ===== EXPERIENCE =====
document.getElementById('add-exp').addEventListener('click', () => {
  document.getElementById('exp-form').style.display = 'block';
  document.getElementById('add-exp').style.display = 'none';
});
function cancelExp() {
  document.getElementById('exp-form').style.display = 'none';
  document.getElementById('add-exp').style.display = 'flex';
  clearExpForm();
}
function saveExp() {
  const title = document.getElementById('ef-title').value.trim();
  const company = document.getElementById('ef-company').value.trim();
  if (!title || !company) { showToast('Please enter job title and company name.', false); return; }
  experiences.push({
    title, company,
    start: document.getElementById('ef-start').value.trim(),
    end: document.getElementById('ef-end').value.trim(),
    loc: document.getElementById('ef-loc').value.trim(),
    desc: document.getElementById('ef-desc').value.trim()
  });
  renderExperiences();
  cancelExp();
}
function clearExpForm() {
  ['ef-title','ef-company','ef-start','ef-end','ef-loc','ef-desc'].forEach(id => document.getElementById(id).value = '');
}
function renderExperiences() {
  const list = document.getElementById('exp-list');
  list.innerHTML = experiences.map((e, i) => `
    <div class="exp-card">
      <div class="exp-card-header">
        <div>
          <div class="exp-card-title">${e.title}</div>
          <div class="exp-card-sub">${e.company}${e.start ? ' · ' + e.start + ' – ' + (e.end||'Present') : ''}${e.loc ? ' · ' + e.loc : ''}</div>
        </div>
        <button class="btn-remove" onclick="removeExp(${i})">Remove</button>
      </div>
      ${e.desc ? `<div style="font-size:0.8rem;color:var(--text3);margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${e.desc}</div>` : ''}
    </div>`).join('');
}
function removeExp(i) { experiences.splice(i, 1); renderExperiences(); }

// ===== EDUCATION =====
document.getElementById('add-edu').addEventListener('click', () => {
  document.getElementById('edu-form').style.display = 'block';
  document.getElementById('add-edu').style.display = 'none';
});
function cancelEdu() {
  document.getElementById('edu-form').style.display = 'none';
  document.getElementById('add-edu').style.display = 'flex';
  clearEduForm();
}
function saveEdu() {
  const degree = document.getElementById('edf-degree').value.trim();
  const school = document.getElementById('edf-school').value.trim();
  if (!degree || !school) { showToast('Please enter degree and institution.', false); return; }
  educations.push({
    degree, school,
    year: document.getElementById('edf-year').value.trim(),
    gpa: document.getElementById('edf-gpa').value.trim(),
    notes: document.getElementById('edf-notes').value.trim()
  });
  renderEducations();
  cancelEdu();
}
function clearEduForm() {
  ['edf-degree','edf-school','edf-year','edf-gpa','edf-notes'].forEach(id => document.getElementById(id).value = '');
}
function renderEducations() {
  const list = document.getElementById('edu-list');
  list.innerHTML = educations.map((e, i) => `
    <div class="exp-card">
      <div class="exp-card-header">
        <div>
          <div class="exp-card-title">${e.degree}</div>
          <div class="exp-card-sub">${e.school}${e.year ? ' · ' + e.year : ''}${e.gpa ? ' · GPA: ' + e.gpa : ''}</div>
        </div>
        <button class="btn-remove" onclick="removeEdu(${i})">Remove</button>
      </div>
    </div>`).join('');
}
function removeEdu(i) { educations.splice(i, 1); renderEducations(); }

// ===== NAVIGATION =====
function prevStep() {
  if (currentStep > 0) goToStep(currentStep - 1);
}
function nextStep() {
  if (currentStep < totalSteps - 1) {
    goToStep(currentStep + 1);
  }
}
function goToStep(step) {
  document.querySelectorAll('.form-section').forEach((s, i) => s.classList.toggle('active', i === step));
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === step);
    if (i < step) t.classList.add('done');
    else t.classList.remove('done');
  });
  currentStep = step;
  document.getElementById('step-counter').textContent = `Step ${step + 1} of ${totalSteps}`;
  document.getElementById('progress').style.width = `${((step + 1) / totalSteps) * 100}%`;
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  prev.style.visibility = step === 0 ? 'hidden' : 'visible';
  if (step === totalSteps - 1) {
    next.textContent = '';
    next.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Generate Resume`;
    next.className = 'btn-generate';
    next.onclick = generateResume;
    updateSummaryCard();
  } else {
    next.className = 'btn-next';
    next.innerHTML = 'Next →';
    next.onclick = nextStep;
  }
}
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = parseInt(tab.dataset.tab);
    if (target <= currentStep) goToStep(target);
  });
});

// ===== SUMMARY CARD =====
function updateSummaryCard() {
  const name = `${document.getElementById('fname').value} ${document.getElementById('lname').value}`.trim();
  const title = document.getElementById('title').value;
  const content = document.getElementById('summary-content');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">
      <div><strong>Name:</strong> ${name || '—'}</div>
      <div><strong>Title:</strong> ${title || '—'}</div>
      <div><strong>Skills:</strong> ${skills.length} added</div>
      <div><strong>Experience:</strong> ${experiences.length} role(s)</div>
      <div><strong>Education:</strong> ${educations.length} entry(s)</div>
      <div><strong>Languages:</strong> ${document.getElementById('languages').value ? 'Provided' : '—'}</div>
    </div>`;
}

// ===== GENERATE =====
async function generateResume() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  if (!fname || !lname) { showToast('Please enter your name first.', false); goToStep(0); return; }
  const model = DEFAULT_GEMINI_MODEL;

  document.getElementById('preview-placeholder').style.display = 'none';
  document.getElementById('resume-preview').classList.remove('show');
  document.getElementById('loading-state').classList.add('show');
  document.getElementById('btn-next').disabled = true;

  const userData = {
    personal: {
      name: `${fname} ${lname}`,
      title: document.getElementById('title').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      location: document.getElementById('location').value,
      linkedin: document.getElementById('linkedin').value,
      website: document.getElementById('website').value,
      summary: document.getElementById('summary').value
    },
    skills: { technical: skills, soft: document.getElementById('softskills').value, tools: document.getElementById('tools').value, languages: document.getElementById('languages').value, certifications: document.getElementById('certifications').value },
    experience: experiences,
    education: educations,
    preferences: {
      targetRole: document.getElementById('target-role').value,
      tone: document.getElementById('tone').value,
      notes: document.getElementById('extra-notes').value
    }
  };

  try {
    const res = await fetch(apiUrl('/api/generate-resume'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, model })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP error ${res.status}`;
      if (res.status === 400 && errMsg.includes('key')) {
        throw new Error('Gemini API key is missing or invalid. Please check GEMINI_API_KEY in the .env file.');
      } else {
        throw new Error(errMsg);
      }
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const resume = sanitizeResumeForDisplay(JSON.parse(raw), userData);
    
    currentResume = resume;
    resumeText = JSON.stringify(resume);
    renderResumePreview(resume);
    
    document.getElementById('loading-state').classList.remove('show');
    document.getElementById('resume-preview').classList.add('show');
    document.getElementById('btn-dl').disabled = false;
    document.getElementById('btn-copy').disabled = false;
    document.getElementById('btn-next').disabled = false;
    showToast('Resume generated successfully!');
  } catch (e) {
    document.getElementById('loading-state').classList.remove('show');
    document.getElementById('preview-placeholder').style.display = 'flex';
    document.getElementById('btn-next').disabled = false;
    
    console.error(e);
    const message = e instanceof TypeError && e.message === 'Failed to fetch'
      ? 'Cannot connect to the local server. Start it with npm start, then open http://localhost:3000.'
      : e.message || 'Error generating resume. Please try again.';
    showToast(message, false);
  }
}

// ===== TEMPLATE SELECTION =====
function openTemplateModal() {
  document.getElementById('template-modal').classList.add('show');
  updateTemplateSelection();
}

function closeTemplateModal() {
  document.getElementById('template-modal').classList.remove('show');
}

function selectTemplate(template) {
  selectedTemplate = template;
  localStorage.setItem('resume_template', template);
  updateTemplateSelection();

  if (currentResume) {
    renderResumePreview(currentResume);
  }

  closeTemplateModal();
  showToast('Template updated successfully!');
}

function updateTemplateSelection() {
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.toggle('active', card.dataset.template === selectedTemplate);
  });
}

document.getElementById('template-modal').addEventListener('click', e => {
  if (e.target.id === 'template-modal') closeTemplateModal();
});

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

function sanitizeResumeForDisplay(resume, userData) {
  const personal = userData.personal || {};
  const enteredSkills = userData.skills || {};
  const enteredExperience = Array.isArray(userData.experience) ? userData.experience : [];
  const enteredEducation = Array.isArray(userData.education) ? userData.education : [];
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
        const aiBullets = splitEnteredList(aiItem.bullets);

        return {
          title: cleanText(item.title),
          company: cleanText(item.company),
          duration,
          location: cleanText(item.loc),
          bullets: cleanText(item.desc) ? (aiBullets.length ? aiBullets : splitEnteredList(item.desc)) : []
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

function renderResumePreview(r) {
  const skillsArr = [...(r.skills?.technical || []), ...(r.skills?.tools || [])];
  const softArr = r.skills?.soft || [];
  const contactHTML = [
    r.contact?.email ? `<span class="res-contact-item">✉ ${r.contact.email}</span>` : '',
    r.contact?.phone ? `<span class="res-contact-item">✆ ${r.contact.phone}</span>` : '',
    r.contact?.location ? `<span class="res-contact-item">⌖ ${r.contact.location}</span>` : '',
    r.contact?.linkedin ? `<span class="res-contact-item">in ${r.contact.linkedin}</span>` : '',
    r.contact?.website ? `<span class="res-contact-item">↗ ${r.contact.website}</span>` : ''
  ].filter(Boolean).join('');
  const expHTML = (r.experience || []).map(e => `
    <div class="res-exp-item">
      <div class="res-exp-header">
        <div class="res-exp-role">${e.title}</div>
        <div class="res-exp-meta">
          <span class="res-exp-company">${e.company}</span>
          ${e.duration ? `<span>${e.duration}</span>` : ''}
          ${e.location ? `<span>· ${e.location}</span>` : ''}
        </div>
      </div>
      ${(e.bullets || []).length ? `<div class="res-exp-desc"><ul>${(e.bullets||[]).map(b=>`<li>${b}</li>`).join('')}</ul></div>` : ''}
    </div>`).join('');
  const eduHTML = (r.education || []).map(e => `
    <div class="res-edu-item">
      <div class="res-edu-degree">${e.degree}</div>
      <div class="res-edu-school">${e.school}</div>
      <div class="res-edu-year">${e.year}${e.gpa ? ' · ' + e.gpa : ''}${e.honors ? ' · ' + e.honors : ''}</div>
    </div>`).join('');
  const certHTML = (r.skills?.certifications || []).map(c => `<div class="res-skill-item">${c}</div>`).join('');
  const langHTML = (r.skills?.languages || []).map(l => `<div class="res-lang">${l}</div>`).join('');
  const sidebarHTML = `
    ${skillsArr.length ? `<div class="res-section"><div class="res-section-title">Technical Skills</div><div class="res-skills">${skillsArr.map(s=>`<div class="res-skill-item">${s}</div>`).join('')}</div></div>` : ''}
    ${softArr.length ? `<div class="res-section"><div class="res-section-title">Soft Skills</div><div class="res-skills">${softArr.map(s=>`<div class="res-skill-item">${s}</div>`).join('')}</div></div>` : ''}
    ${certHTML ? `<div class="res-section"><div class="res-section-title">Certifications</div><div class="res-skills">${certHTML}</div></div>` : ''}
    ${langHTML ? `<div class="res-section"><div class="res-section-title">Languages</div>${langHTML}</div>` : ''}
  `.trim();
  const mainHTML = `
    ${r.summary ? `<div class="res-section"><div class="res-section-title">Professional Summary</div><div class="res-summary">${r.summary}</div></div>` : ''}
    ${expHTML ? `<div class="res-section"><div class="res-section-title">Work Experience</div>${expHTML}</div>` : ''}
    ${eduHTML ? `<div class="res-section"><div class="res-section-title">Education</div>${eduHTML}</div>` : ''}
  `.trim();

  document.getElementById('resume-preview').innerHTML = `
    <div class="resume-doc ${selectedTemplate}" id="resume-doc">
      <div class="res-header">
        <div class="res-name">${r.name}</div>
        ${r.title ? `<div class="res-title">${r.title}</div>` : ''}
        ${contactHTML ? `<div class="res-contact">${contactHTML}</div>` : ''}
      </div>
      ${sidebarHTML || mainHTML ? `<div class="res-body" style="${sidebarHTML ? '' : 'display:block;'}">${sidebarHTML ? `<div class="res-sidebar">${sidebarHTML}</div>` : ''}${mainHTML ? `<div class="res-main">${mainHTML}</div>` : ''}</div>` : ''}
    </div>`;
}

// ===== DOWNLOAD =====
async function downloadResume() {
  const el = document.getElementById('resume-doc');
  if (!el) {
    showToast('Generate a resume before downloading.', false);
    return;
  }

  const fileName = `${(document.getElementById('fname').value || 'resume').trim()}-${(document.getElementById('lname').value || '').trim()}-resume`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'resume';
  const styles = await fetch(apiUrl('/styles.css')).then(res => res.text()).catch(() => '');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${fileName}</title>
<style>
${styles}
body { background: #fff; padding: 24px; }
.resume-preview, .resume-doc { display: block; }
.resume-doc { max-width: 850px; margin: 0 auto; }
</style>
</head>
<body>
${el.outerHTML}
</body>
</html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Resume downloaded successfully!');
}

// ===== COPY =====
function copyResume() {
  const el = document.getElementById('resume-doc');
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => showToast('Resume text copied to clipboard!'));
}

// ===== TOAST =====
function showToast(msg, success = true) {
  const toast = document.getElementById('toast');
  const dot = toast.querySelector('.toast-dot');
  document.getElementById('toast-msg').textContent = msg;
  dot.style.background = success ? 'var(--success)' : 'var(--danger)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== INIT =====
updateTemplateSelection();
goToStep(0);
